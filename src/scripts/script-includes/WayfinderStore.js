var WayfinderStore = Class.create();

WayfinderStore.T_CONVERSATION = 'x_snc_wayfinder_ai_conversation';
WayfinderStore.T_MESSAGE = 'x_snc_wayfinder_ai_message';
WayfinderStore.T_JOB = 'x_snc_wayfinder_ai_chat_job';
WayfinderStore.T_TOOL = 'x_snc_wayfinder_ai_tool';
WayfinderStore.PROP_PREFIX = 'x_snc_wayfinder_ai.';
WayfinderStore.ACTIVE_JOB_STATES = ['new', 'running', 'tool_call', 'streaming', 'awaiting_confirmation', 'confirmed', 'cancelled'];

// Last sequence value handed out in this transaction, so two inserts in the
// same millisecond still sort in insert order.
WayfinderStore._lastSeq = 0;

WayfinderStore.prototype = {
    initialize: function () {},

    prop: function (name, fallback) {
        var v = gs.getProperty(WayfinderStore.PROP_PREFIX + name, '');
        v = v === null || v === undefined ? '' : String(v);
        return v === '' && fallback !== undefined ? String(fallback) : v;
    },

    // ---- conversations -------------------------------------------------

    createConversation: function (userId) {
        var gr = new GlideRecord(WayfinderStore.T_CONVERSATION);
        gr.initialize();
        gr.setValue('user', userId);
        gr.setValue('title', 'New chat');
        gr.setValue('mode', 'ai');
        var id = gr.insert();
        if (!id) throw new Error('Could not create conversation: ' + (gr.getLastErrorMessage() || 'insert failed'));
        return gr;
    },

    // Returns the conversation GlideRecord only when userId owns it.
    getOwnedConversation: function (convId, userId) {
        if (!convId || !userId) return null;
        var gr = new GlideRecord(WayfinderStore.T_CONVERSATION);
        if (!gr.get(String(convId))) return null;
        if (gr.getValue('user') !== String(userId)) return null;
        return gr;
    },

    // Returns {job, conversation} only when userId owns the job's conversation.
    getOwnedJob: function (jobId, userId) {
        if (!jobId || !userId) return null;
        var job = new GlideRecord(WayfinderStore.T_JOB);
        if (!job.get(String(jobId))) return null;
        var conv = this.getOwnedConversation(job.getValue('conversation'), userId);
        if (!conv) return null;
        return { job: job, conversation: conv };
    },

    listConversations: function (userId) {
        var out = [];
        var gr = new GlideRecord(WayfinderStore.T_CONVERSATION);
        gr.addQuery('user', userId);
        gr.orderByDesc('sys_updated_on');
        gr.setLimit(100);
        gr.query();
        while (gr.next()) {
            out.push({
                sys_id: gr.getUniqueValue(),
                title: gr.getValue('title') || 'New chat',
                mode: gr.getValue('mode') || 'ai',
                updated_at: gr.getDisplayValue('sys_updated_on'),
            });
        }
        return out;
    },

    // A job blocks new messages while it is working (unless it has been silent for
    // 10 minutes, i.e. it crashed) or while it waits for the user's approval.
    hasActiveJob: function (convId) {
        if (this.getPendingJob(convId)) return true;
        var cutoff = new GlideDateTime();
        cutoff.addSeconds(-600);
        var gr = new GlideRecord(WayfinderStore.T_JOB);
        gr.addQuery('conversation', convId);
        gr.addQuery('status', 'IN', WayfinderStore.ACTIVE_JOB_STATES.join(','));
        gr.addQuery('sys_updated_on', '>', cutoff);
        gr.setLimit(1);
        gr.query();
        return gr.hasNext();
    },

    // The job waiting for approval in this conversation, if any: {job_sys_id, pending}.
    getPendingJob: function (convId) {
        var gr = new GlideRecord(WayfinderStore.T_JOB);
        gr.addQuery('conversation', convId);
        gr.addQuery('status', 'awaiting_confirmation');
        gr.orderByDesc('sys_created_on');
        gr.setLimit(1);
        gr.query();
        if (!gr.next()) return null;
        return { job_sys_id: gr.getUniqueValue(), pending: WayfinderStore.parseJson(gr.getValue('pending_tool_calls'), []) || [] };
    },

    // Deletes messages and jobs explicitly (logging failures), then the conversation.
    deleteConversation: function (convId) {
        var tables = [WayfinderStore.T_MESSAGE, WayfinderStore.T_JOB];
        for (var i = 0; i < tables.length; i++) {
            var gr = new GlideRecord(tables[i]);
            gr.addQuery('conversation', convId);
            gr.query();
            while (gr.next()) {
                if (!gr.deleteRecord()) gs.warn('[Wayfinder] could not delete ' + tables[i] + ' ' + gr.getUniqueValue());
            }
        }
        var conv = new GlideRecord(WayfinderStore.T_CONVERSATION);
        if (conv.get(convId) && !conv.deleteRecord()) {
            throw new Error('Could not delete conversation: ' + (conv.getLastErrorMessage() || 'delete failed'));
        }
    },

    // ---- messages ------------------------------------------------------

    nextSeq: function () {
        var ms = Number(new GlideDateTime().getNumericValue());
        if (ms <= WayfinderStore._lastSeq) ms = WayfinderStore._lastSeq + 1;
        WayfinderStore._lastSeq = ms;
        var s = String(ms);
        while (s.length < 16) s = '0' + s;
        return s;
    },

    // opts: {name, toolCallId, toolCalls (JSON string), source, agentName}
    insertMessage: function (convId, role, content, opts) {
        opts = opts || {};
        var gr = new GlideRecord(WayfinderStore.T_MESSAGE);
        gr.initialize();
        gr.setValue('conversation', convId);
        gr.setValue('role', role);
        gr.setValue('content', content === null || content === undefined ? '' : String(content));
        if (opts.name) gr.setValue('tool_name', opts.name);
        if (opts.toolCallId) gr.setValue('tool_call_id', opts.toolCallId);
        if (opts.toolCalls) gr.setValue('tool_calls', opts.toolCalls);
        if (opts.source) gr.setValue('source', opts.source);
        if (opts.agentName) gr.setValue('agent_name', opts.agentName);
        gr.setValue('seq', this.nextSeq());
        var id = gr.insert();
        if (!id) throw new Error('Could not save message: ' + (gr.getLastErrorMessage() || 'insert failed'));
        return String(id);
    },

    _queryMessages: function (convId) {
        var gr = new GlideRecord(WayfinderStore.T_MESSAGE);
        gr.addQuery('conversation', convId);
        gr.orderBy('seq');
        gr.orderBy('sys_created_on');
        gr.query();
        return gr;
    },

    // Raw rows for rebuilding model history.
    loadRawMessages: function (convId) {
        var out = [];
        var gr = this._queryMessages(convId);
        while (gr.next()) {
            out.push({
                role: gr.getValue('role'),
                content: gr.getValue('content') || '',
                name: gr.getValue('tool_name') || '',
                tool_call_id: gr.getValue('tool_call_id') || '',
                tool_calls: WayfinderStore.parseJson(gr.getValue('tool_calls'), null),
            });
        }
        return out;
    },

    // The one shared loader for the chat widget.
    loadMessages: function (convId) {
        var out = [];
        var gr = this._queryMessages(convId);
        while (gr.next()) {
            var m = {
                sys_id: gr.getUniqueValue(),
                role: gr.getValue('role'),
                content: gr.getValue('content') || '',
                created_at: gr.getDisplayValue('sys_created_on'),
            };
            if (gr.getValue('tool_name')) m.name = gr.getValue('tool_name');
            if (gr.getValue('tool_call_id')) m.tool_call_id = gr.getValue('tool_call_id');
            if (gr.getValue('tool_calls')) m.tool_calls = WayfinderStore.parseJson(gr.getValue('tool_calls'), null);
            if (gr.getValue('source')) m.source = gr.getValue('source');
            if (gr.getValue('agent_name')) m.agent_name = gr.getValue('agent_name');
            if (m.role === 'tool') m.parsed = WayfinderStore.parseJson(m.content, null);
            out.push(m);
        }
        return out;
    },

    // queued/accepted from the messages; closed is decided client-side when mode flips back to ai.
    deriveAgentStatus: function (convId) {
        var first = null;
        var agentName = '';
        var accepted = false;
        var gr = this._queryMessages(convId);
        while (gr.next()) {
            if (!first) first = gr.getValue('sys_created_on');
            if (gr.getValue('source') === 'agent') {
                accepted = true;
                agentName = gr.getValue('agent_name') || agentName;
            }
        }
        var age = 0;
        if (first) {
            var start = new GlideDateTime(first).getNumericValue();
            age = Math.max(0, Math.round((new GlideDateTime().getNumericValue() - start) / 1000));
        }
        return { queued: !accepted, accepted: accepted, agent_name: agentName, age_seconds: age, closed: false };
    },

    getUserName: function (userId) {
        var u = new GlideRecord('sys_user');
        return u.get(userId) ? u.getValue('user_name') || '' : '';
    },

    type: 'WayfinderStore',
};

WayfinderStore.parseJson = function (text, fallback) {
    if (text === null || text === undefined || text === '') return fallback;
    try {
        return JSON.parse(String(text));
    } catch (e) {
        return fallback;
    }
};
