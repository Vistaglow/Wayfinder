var WayfinderAgent = Class.create();

WayfinderAgent.MAX_ITERATIONS = 4;
WayfinderAgent.MAX_TOOL_RESULT_CHARS = 16000;
WayfinderAgent.DEFAULT_SYSTEM_PROMPT = 'You are Wayfinder, a helpful internal assistant. Use the available tools to answer; they run with the asking user\'s own permissions. If no tool fits, say so rather than guessing.';
WayfinderAgent.ITERATION_LIMIT_TEXT = '[stopped: exceeded tool-call iteration limit]';
WayfinderAgent.DECLINED_RESULT = '{"ok":false,"error":"User declined this action."}';
WayfinderAgent.MISSING_RESULT = '{"ok":false,"error":"tool result missing in history"}';

WayfinderAgent.prototype = {
    initialize: function () {
        this.store = new x_snc_wayfinder_ai.WayfinderStore();
    },

    // Entry point for the async insert rule: one user turn.
    runJob: function (jobSysId) {
        this._run(jobSysId, false);
    },

    // Entry point for the async update rule: the user approved or cancelled pending tool calls.
    resumeJob: function (jobSysId) {
        this._run(jobSysId, true);
    },

    _run: function (jobSysId, isResume) {
        var job = this._getJob(jobSysId);
        if (!job) {
            gs.warn('[Wayfinder] chat job not found: ' + jobSysId);
            return;
        }
        var convId = job.getValue('conversation');
        var conv = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_CONVERSATION);
        if (!conv.get(convId)) {
            this._fail(jobSysId, 'conversation no longer exists');
            return;
        }
        var ownerId = conv.getValue('user');
        // Read config before any identity switch: some properties are admin-only.
        var systemPrompt = this.store.prop('system_prompt') || WayfinderAgent.DEFAULT_SYSTEM_PROMPT;

        var imp = null;
        var previous = null;
        try {
            if (gs.getUserID() !== ownerId) {
                // Async rules normally run as the user who inserted the job. If not,
                // switch identity where the platform allows it (global scope only)...
                if (typeof GlideImpersonate !== 'undefined') {
                    imp = new GlideImpersonate();
                    previous = imp.impersonate(ownerId);
                }
                // ...and refuse to run tools as anyone else (fail closed).
                if (gs.getUserID() !== ownerId) {
                    this._fail(jobSysId, 'The chat job is not running as the conversation owner, so it was stopped to protect data access. Ask an admin to check the Wayfinder business rules.');
                    gs.error('[Wayfinder] job ' + jobSysId + ' runs as ' + gs.getUserID() + ' but the owner is ' + ownerId + '; refusing to run tools.');
                    return;
                }
            }

            this._updateJob(jobSysId, { status: 'running', error_message: '' });
            var ctx = { jobId: jobSysId, convId: convId, ownerId: ownerId, systemPrompt: systemPrompt };

            if (isResume) {
                this._resolvePending(ctx, job);
            } else {
                var text = job.getValue('user_message') || '';
                this.store.insertMessage(convId, 'user', text);
                if ((conv.getValue('title') || 'New chat') === 'New chat' && text) {
                    conv.setValue('title', text.replace(/\s+/g, ' ').substring(0, 60));
                    conv.update();
                }
            }
            this._loop(ctx);
        } catch (e) {
            var msg = String(e && e.message ? e.message : e);
            gs.error('[Wayfinder] job ' + jobSysId + ' failed: ' + msg);
            this._fail(jobSysId, msg);
        } finally {
            // GlideImpersonate has no "unimpersonate": switching back is another impersonate call.
            if (imp && previous) imp.impersonate(previous);
        }
    },

    _loop: function (ctx) {
        var tools = new x_snc_wayfinder_ai.WayfinderTools();
        var azure = new x_snc_wayfinder_ai.WayfinderAzureClient();
        var toolDefs = tools.getDefinitions();
        var needsApproval = tools.getConfirmationMap();
        var messages = this.assembleHistory(this.store.loadRawMessages(ctx.convId), ctx.systemPrompt);
        var finalText = null;

        for (var iter = 0; iter < WayfinderAgent.MAX_ITERATIONS; iter++) {
            if (!this._stillExists(ctx)) return;
            var reply = azure.complete(messages, toolDefs);
            if (!reply.tool_calls) {
                finalText = reply.content || '';
                break;
            }
            if (!this._stillExists(ctx)) return;
            this.store.insertMessage(ctx.convId, 'assistant', reply.content || '', { toolCalls: JSON.stringify(reply.tool_calls) });
            messages.push({ role: 'assistant', content: reply.content || null, tool_calls: reply.tool_calls });

            var pending = [];
            for (var i = 0; i < reply.tool_calls.length; i++) {
                var call = reply.tool_calls[i];
                var fn = call['function'] || {};
                if (needsApproval[fn.name]) {
                    pending.push({ tool_call_id: call.id, name: fn.name, args: this.parseArgs(fn.arguments) });
                    continue;
                }
                messages.push(this._runTool(ctx, tools, call));
            }
            if (pending.length) {
                // The gate: nothing that needs approval runs until the user says so.
                this._updateJob(ctx.jobId, {
                    status: 'awaiting_confirmation',
                    pending_tool_calls: JSON.stringify(pending),
                    last_tool: pending[0].name,
                });
                return;
            }
        }

        if (finalText === null) finalText = WayfinderAgent.ITERATION_LIMIT_TEXT;
        if (!this._stillExists(ctx)) return;
        this.store.insertMessage(ctx.convId, 'assistant', finalText);
        this._updateJob(ctx.jobId, { status: 'complete', content: finalText, pending_tool_calls: '' });
    },

    // Runs (approved) or declines (cancelled) the calls stored by the gate.
    _resolvePending: function (ctx, job) {
        var approved = job.getValue('status') === 'confirmed';
        var pending = x_snc_wayfinder_ai.WayfinderStore.parseJson(job.getValue('pending_tool_calls'), []) || [];
        var tools = new x_snc_wayfinder_ai.WayfinderTools();
        for (var i = 0; i < pending.length; i++) {
            var p = pending[i];
            if (approved) {
                this._runTool(ctx, tools, { id: p.tool_call_id, 'function': { name: p.name, arguments: JSON.stringify(p.args || {}) } });
            } else {
                this.store.insertMessage(ctx.convId, 'tool', WayfinderAgent.DECLINED_RESULT, { name: p.name, toolCallId: p.tool_call_id });
            }
        }
        this._updateJob(ctx.jobId, { pending_tool_calls: '', status: 'running' });
    },

    _runTool: function (ctx, tools, call) {
        var fn = call['function'] || {};
        var name = fn.name || '';
        var args = this.parseArgs(fn.arguments);
        this._updateJob(ctx.jobId, { status: 'tool_call', last_tool: name });
        var result;
        try {
            result = tools.execute(name, args, { userId: ctx.ownerId, conversationId: ctx.convId, jobId: ctx.jobId });
        } catch (e) {
            result = { ok: false, error: 'tool failed: ' + (e && e.message ? e.message : e) };
        }
        var content = this.serializeResult(result);
        this.store.insertMessage(ctx.convId, 'tool', content, { name: name, toolCallId: call.id });
        return { role: 'tool', tool_call_id: call.id, name: name, content: content };
    },

    parseArgs: function (raw) {
        if (raw && typeof raw === 'object') return raw;
        try {
            var v = JSON.parse(raw || '{}');
            return v && typeof v === 'object' ? v : {};
        } catch (e) {
            return { _parse_error: String(raw || '').substring(0, 500) };
        }
    },

    // Keeps oversized results valid JSON: trims the results array (or the string)
    // and wraps it in {ok, truncated:true, data} instead of slicing mid-token.
    serializeResult: function (result) {
        var max = WayfinderAgent.MAX_TOOL_RESULT_CHARS;
        var s = JSON.stringify(result === undefined ? { ok: false, error: 'tool returned nothing' } : result);
        if (s.length <= max) return s;
        var ok = !!(result && result.ok);
        var data = result ? result.data : null;
        var env;
        if (data && Array.isArray(data.results)) {
            var copy = {};
            for (var k in data) if (data.hasOwnProperty(k)) copy[k] = data[k];
            copy.results = data.results.slice(0);
            env = { ok: ok, truncated: true, data: copy };
            while (copy.results.length && JSON.stringify(env).length > max) copy.results.pop();
            copy.returned = copy.results.length;
            if (JSON.stringify(env).length <= max) return JSON.stringify(env);
        }
        var text = typeof data === 'string' ? data : JSON.stringify(data === undefined ? result : data);
        var budget = max - 200;
        env = { ok: ok, truncated: true, data: text.substring(0, budget) };
        while (JSON.stringify(env).length > max && budget > 0) {
            budget = Math.floor(budget * 0.9);
            env.data = text.substring(0, budget);
        }
        return JSON.stringify(env);
    },

    // Rebuilds model history without trusting timestamp order: each assistant
    // tool-call row is followed by exactly its tool rows (placed by tool_call_id),
    // and a missing result is synthesized so the model API accepts the history.
    assembleHistory: function (rows, systemPrompt) {
        var messages = [{ role: 'system', content: systemPrompt }];
        var byCallId = {};
        var i;
        for (i = 0; i < rows.length; i++) {
            if (rows[i].role === 'tool' && rows[i].tool_call_id) byCallId[rows[i].tool_call_id] = rows[i];
        }
        for (i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (r.role === 'tool') continue; // placed after its parent below
            if (r.role === 'assistant' && r.tool_calls && r.tool_calls.length) {
                messages.push({ role: 'assistant', content: r.content || null, tool_calls: r.tool_calls });
                for (var j = 0; j < r.tool_calls.length; j++) {
                    var call = r.tool_calls[j];
                    var t = byCallId[call.id];
                    var name = (call['function'] && call['function'].name) || '';
                    messages.push({
                        role: 'tool',
                        tool_call_id: call.id,
                        name: t ? t.name || name : name,
                        content: t ? t.content : WayfinderAgent.MISSING_RESULT,
                    });
                }
                continue;
            }
            if (r.role === 'user' || r.role === 'assistant') messages.push({ role: r.role, content: r.content || '' });
        }
        return messages;
    },

    // ---- job helpers (re-read every time: the user may delete the chat mid-run) ----

    _getJob: function (jobId) {
        var job = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_JOB);
        return job.get(jobId) ? job : null;
    },

    _stillExists: function (ctx) {
        var conv = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_CONVERSATION);
        return !!(this._getJob(ctx.jobId) && conv.get(ctx.convId));
    },

    _updateJob: function (jobId, fields) {
        var job = this._getJob(jobId);
        if (!job) return false;
        for (var k in fields) if (fields.hasOwnProperty(k)) job.setValue(k, fields[k]);
        job.update();
        return true;
    },

    _fail: function (jobId, message) {
        this._updateJob(jobId, { status: 'error', error_message: String(message).substring(0, 1000) });
    },

    type: 'WayfinderAgent',
};
