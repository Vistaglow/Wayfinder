var WayfinderTools = Class.create();

WayfinderTools.MAX_LIMIT_FACTOR = 2;

// Date helpers a raw (model-written) query may still call through javascript:.
// Anything else after "javascript:" is refused.
WayfinderTools.ALLOWED_QUERY_JS = /^gs\.(getUserID|beginningOfToday|endOfToday|beginningOfYesterday|endOfYesterday|beginningOfThisWeek|endOfThisWeek|beginningOfLastWeek|endOfLastWeek|beginningOfThisMonth|endOfThisMonth|beginningOfLastMonth|endOfLastMonth|beginningOfThisQuarter|endOfThisQuarter|beginningOfLastQuarter|endOfLastQuarter|beginningOfThisYear|endOfThisYear|beginningOfLastYear|endOfLastYear|daysAgo|daysAgoStart|daysAgoEnd|hoursAgo|hoursAgoStart|hoursAgoEnd|minutesAgo|minutesAgoStart|minutesAgoEnd|monthsAgo|monthsAgoStart|monthsAgoEnd|quartersAgo|quartersAgoStart|quartersAgoEnd|yearsAgo)\(\s*-?\d*\s*\)$/;

// sys_choice elements returned with get_task so the model can map labels to values.
WayfinderTools.TASK_CHOICE_ELEMENTS = ['state', 'priority', 'urgency', 'impact', 'close_code'];

// Catalog variable type codes (item_option_new.type) to the simple types the model sees.
// Layout-only, attachment and masked (password) variables are dropped.
WayfinderTools.VARIABLE_TYPES = {
    1: 'boolean', 7: 'boolean',
    2: 'multiline_text',
    3: 'choice', 5: 'choice', 18: 'choice', 22: 'choice',
    4: 'number',
    6: 'text', 16: 'text', 23: 'text',
    8: 'reference', 31: 'reference',
    9: 'date',
    10: 'datetime',
    21: 'multi_reference',
    26: 'email',
    27: 'url',
    28: 'ip_address',
    29: 'duration',
};

WayfinderTools.prototype = {
    initialize: function () {},

    // ==== catalog of tools ================================================

    // OpenAI-shape function definitions for every enabled tool.
    getDefinitions: function () {
        var defs = [];
        var gr = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_TOOL);
        gr.addQuery('enabled', true);
        gr.orderBy('name');
        gr.query();
        while (gr.next()) {
            var cfg = this._configFromRow(gr);
            if (cfg.parseError) {
                gs.error('[Wayfinder] tool ' + cfg.name + ' skipped: parameters_json is not valid JSON (' + cfg.parseError + ')');
                continue;
            }
            defs.push(this.buildDefinition(cfg));
        }
        if (!defs.length) gs.warn('[Wayfinder] no tools are enabled; chat runs as plain LLM chat.');
        return defs;
    },

    // name -> true for enabled tools that need the user's approval.
    getConfirmationMap: function () {
        var map = {};
        var gr = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_TOOL);
        gr.addQuery('enabled', true);
        gr.addQuery('require_confirmation', true);
        gr.query();
        while (gr.next()) map[gr.getValue('name')] = true;
        return map;
    },

    buildDefinition: function (cfg) {
        var properties = {};
        var required = [];
        for (var i = 0; i < cfg.params.length; i++) {
            var p = cfg.params[i];
            properties[p.name] = { type: this._jsonSchemaType(p.type), description: p.description || '' };
            if (p.required) required.push(p.name);
        }
        var parameters = { type: 'object', properties: properties };
        if (required.length) parameters.required = required;
        return {
            type: 'function',
            'function': { name: cfg.name, description: cfg.description || '', parameters: parameters },
        };
    },

    _jsonSchemaType: function (t) {
        t = String(t || 'string').toLowerCase();
        if (t === 'integer' || t === 'number' || t === 'boolean' || t === 'object' || t === 'string') return t;
        return 'string';
    },

    // ==== execution =======================================================

    execute: function (name, args, context) {
        var gr = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_TOOL);
        gr.addQuery('name', String(name || ''));
        gr.addQuery('enabled', true);
        gr.setLimit(1);
        gr.query();
        if (!gr.next()) return { ok: false, error: 'unknown or disabled tool: ' + name };
        return this.executeConfig(this._configFromRow(gr), args, context);
    },

    // Also used by the tool builder's Test panel with an unsaved draft.
    executeConfig: function (cfg, args, context) {
        args = args && typeof args === 'object' ? args : {};
        context = context || {};
        try {
            if (cfg.parseError) return { ok: false, error: 'tool parameters_json is not valid JSON' };
            var missing = this._missingRequired(cfg, args);
            if (missing.length) return { ok: false, error: 'missing required parameter(s): ' + missing.join(', ') };
            if (cfg.kind === 'builtin') return this._executeBuiltin(cfg, args, context);
            if (!/^[a-z0-9_]+$/.test(cfg.table || '')) return { ok: false, error: 'tool has no valid target table' };
            if (cfg.operation === 'update') return this._executeTableUpdate(cfg, args, context);
            if (cfg.operation === 'create') return this._executeTableCreate(cfg, args, context);
            return this._executeTableRead(cfg, args, context);
        } catch (e) {
            gs.error('[Wayfinder] tool ' + cfg.name + ' failed: ' + (e && e.message ? e.message : e));
            return { ok: false, error: 'tool failed: ' + (e && e.message ? e.message : String(e)) };
        }
    },

    _missingRequired: function (cfg, args) {
        var out = [];
        for (var i = 0; i < cfg.params.length; i++) {
            var p = cfg.params[i];
            var v = args[p.name];
            if (p.required && (v === undefined || v === null || String(v) === '')) out.push(p.name);
        }
        return out;
    },

    // ==== config normalization ============================================

    _configFromRow: function (gr) {
        return this.normalizeConfig({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('name'),
            description: gr.getValue('description'),
            enabled: gr.getValue('enabled'),
            kind: gr.getValue('kind'),
            operation: gr.getValue('operation'),
            parameters_json: gr.getValue('parameters_json'),
            target_table: gr.getValue('target_table'),
            encoded_query_template: gr.getValue('encoded_query_template'),
            return_fields: gr.getValue('return_fields'),
            max_results: gr.getValue('max_results'),
            require_confirmation: gr.getValue('require_confirmation'),
        });
    },

    // Accepts a row-shaped object (or the builder's draft) and returns the runtime config.
    normalizeConfig: function (o) {
        o = o || {};
        var cfg = {
            sys_id: o.sys_id || '',
            name: String(o.name || ''),
            description: String(o.description || ''),
            enabled: this._bool(o.enabled === undefined ? true : o.enabled),
            kind: o.kind === 'builtin' ? 'builtin' : 'table',
            operation: o.operation === 'update' || o.operation === 'create' ? o.operation : 'read',
            table: String(o.target_table || '').trim(),
            template: String(o.encoded_query_template || ''),
            requireConfirmation: this._bool(o.require_confirmation),
            params: [],
            parseError: '',
        };
        var f = o.return_fields;
        var fields = typeof f === 'string' ? f.split(',') : f && f.length ? f : [];
        cfg.fields = [];
        for (var i = 0; i < fields.length; i++) {
            var name = String(fields[i]).trim();
            if (name && cfg.fields.indexOf(name) === -1) cfg.fields.push(name);
        }
        if (!cfg.fields.length) cfg.fields = ['sys_id'];
        var limit = parseInt(o.max_results, 10);
        cfg.limit = limit > 0 ? limit : 10;

        var params = o.parameters;
        if (!params) {
            try {
                params = JSON.parse(o.parameters_json || '[]');
            } catch (e) {
                cfg.parseError = String(e && e.message ? e.message : e);
                params = [];
            }
        }
        if (!Array.isArray(params)) params = [];
        for (var j = 0; j < params.length; j++) {
            var p = params[j] || {};
            if (!p.name) continue;
            cfg.params.push({
                name: String(p.name),
                type: String(p.type || 'string'),
                description: String(p.description || ''),
                required: this._bool(p.required),
                raw_query: this._bool(p.raw_query),
            });
        }
        return cfg;
    },

    _bool: function (v) {
        return v === true || v === 1 || v === '1' || v === 'true';
    },

    // ==== encoded-query building (pure) ===================================

    // Strip anything that could start a new encoded-query clause or a script.
    _clean: function (v) {
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') v = JSON.stringify(v);
        return String(v).replace(/[\^\r\n]/g, ' ').replace(/javascript\s*:/gi, '').trim();
    },

    // A raw (sysparm_query) parameter: may contain ^, but cannot widen the fixed
    // clauses around it (no leading OR, no ^NQ) and may only call date helpers.
    _checkRawQuery: function (v) {
        var s = String(v === null || v === undefined ? '' : v).replace(/[\r\n]/g, ' ').trim();
        s = s.replace(/^\^+/, '').replace(/\^+$/, '');
        if (!s) return { ok: true, value: '' };
        if (/^(OR|NQ)/.test(s) || /\^NQ/.test(s)) {
            return { ok: false, error: 'query may not start with OR or contain ^NQ; it is always ANDed with the tool filter' };
        }
        var re = /javascript\s*:\s*([^\^]*)/gi;
        var m;
        while ((m = re.exec(s)) !== null) {
            if (!WayfinderTools.ALLOWED_QUERY_JS.test(m[1].trim())) {
                return { ok: false, error: 'query may only use javascript: date helpers such as gs.daysAgoStart(7) or gs.getUserID()' };
            }
        }
        return { ok: true, value: s };
    },

    // {namesearch:param:f1,f2} -> AND of OR groups, one group per word (2+ chars).
    _expandNameSearchDirectives: function (tpl, args) {
        var self = this;
        return String(tpl || '').replace(/\{namesearch:([A-Za-z_][A-Za-z0-9_]*):([A-Za-z0-9_.,\s]+)\}/g, function (all, param, fieldList) {
            var fields = fieldList.split(',');
            var cleanFields = [];
            for (var i = 0; i < fields.length; i++) {
                var f = fields[i].trim();
                if (f) cleanFields.push(f);
            }
            var words = self._clean(args[param]).split(/\s+/);
            var groups = [];
            for (var w = 0; w < words.length; w++) {
                var tok = words[w];
                if (tok.length < 2) continue;
                var ors = [];
                for (var k = 0; k < cleanFields.length; k++) ors.push((k ? 'OR' : '') + cleanFields[k] + 'LIKE' + tok);
                if (ors.length) groups.push(ors.join('^'));
            }
            return groups.join('^');
        });
    },

    _substituteUserContext: function (s, userId) {
        return String(s || '')
            .replace(/javascript\s*:\s*gs\.getUserID\(\s*\)/g, String(userId || ''))
            .split('{user_sys_id}').join(String(userId || ''));
    },

    _cleanEncodedQuery: function (q) {
        return String(q || '').replace(/\^{2,}/g, '^').replace(/^\^+/, '').replace(/\^+$/, '');
    },

    // Builds the final encoded query for a read tool. Clauses whose placeholders
    // all resolve to empty are dropped, so optional parameters do not turn into
    // "field=" filters. Returns {query} or {error}.
    buildQuery: function (cfg, args, userId) {
        var rawParams = {};
        for (var i = 0; i < cfg.params.length; i++) if (cfg.params[i].raw_query) rawParams[cfg.params[i].name] = true;
        var clauses = String(cfg.template || '').replace(/[\r\n]+/g, '').split('^');
        var out = [];
        var error = '';
        var self = this;
        for (var c = 0; c < clauses.length; c++) {
            var clause = clauses[c];
            if (!clause) continue;
            if (/\{namesearch:/.test(clause)) {
                clause = this._expandNameSearchDirectives(clause, args);
                if (!clause) continue;
            }
            var hadPlaceholder = false;
            var allEmpty = true;
            clause = clause.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, function (all, name) {
                if (name === 'user_sys_id') return all;
                hadPlaceholder = true;
                var value;
                if (rawParams[name]) {
                    var chk = self._checkRawQuery(args[name]);
                    if (!chk.ok) {
                        error = chk.error;
                        return '';
                    }
                    value = chk.value;
                } else {
                    value = self._clean(args[name]);
                }
                if (value !== '') allEmpty = false;
                return value;
            });
            if (error) return { error: error };
            if (hadPlaceholder && allEmpty) continue;
            out.push(clause);
        }
        var q = this._substituteUserContext(out.join('^'), userId);
        return { query: this._cleanEncodedQuery(q) };
    },

    _effectiveLimit: function (cfg, args) {
        var requested = parseInt(args.limit, 10);
        if (requested > 0) return Math.min(requested, cfg.limit * WayfinderTools.MAX_LIMIT_FACTOR);
        return cfg.limit;
    },

    // ==== generic table tools =============================================

    _rowOut: function (gr, fields) {
        var row = { sys_id: gr.getUniqueValue() };
        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (f === 'sys_id' || !gr.isValidField(f)) continue;
            var el = gr.getElement(f);
            if (el && typeof el.canRead === 'function' && !el.canRead()) continue;
            var raw = gr.getValue(f);
            var disp = gr.getDisplayValue(f);
            raw = raw === null || raw === undefined ? '' : String(raw);
            disp = disp === null || disp === undefined ? '' : String(disp);
            row[f] = disp !== '' && disp !== raw ? disp : raw;
        }
        return row;
    },

    _executeTableRead: function (cfg, args, context) {
        var built = this.buildQuery(cfg, args, context.userId);
        if (built.error) return { ok: false, error: built.error };
        var gr = new GlideRecordSecure(cfg.table);
        if (!gr.isValid()) return { ok: false, error: 'target table does not exist: ' + cfg.table };
        if (built.query) {
            if (typeof gr.isEncodedQueryValid === 'function' && !gr.isEncodedQueryValid(built.query)) {
                return { ok: false, error: 'the encoded query is not valid for ' + cfg.table + ': ' + built.query };
            }
            gr.addEncodedQuery(built.query);
        }
        gr.setLimit(this._effectiveLimit(cfg, args));
        gr.query();
        var results = [];
        while (gr.next()) {
            if (!gr.canRead()) continue; // defense in depth on top of GlideRecordSecure
            results.push(this._rowOut(gr, cfg.fields));
        }
        gs.info('[Wayfinder] read ' + cfg.table + ' as ' + gs.getUserName() + ' (context user ' + context.userId + ') query="' + built.query + '" rows=' + results.length);
        return { ok: true, data: { results: results, count: results.length, table: cfg.table, query: built.query } };
    },

    // Only parameters the admin declared are written; everything else is dropped and logged.
    _collectWrites: function (cfg, args, gr, userId) {
        var declared = {};
        for (var i = 0; i < cfg.params.length; i++) declared[cfg.params[i].name] = true;
        var res = { set: [], dropped: [], denied: [] };
        for (var key in args) {
            if (!args.hasOwnProperty(key) || key === 'sys_id' || key === 'limit') continue;
            if (!declared[key]) {
                res.dropped.push(key);
                continue;
            }
            var v = args[key];
            if (v === null || v === undefined || String(v) === '') continue;
            if (!gr.isValidField(key)) {
                res.dropped.push(key);
                continue;
            }
            var el = gr.getElement(key);
            if (el && typeof el.canWrite === 'function' && !el.canWrite()) {
                res.denied.push(key);
                continue;
            }
            if (typeof v === 'object') v = JSON.stringify(v);
            gr.setValue(key, this._substituteUserContext(String(v), userId));
            res.set.push(key);
        }
        if (res.dropped.length) gs.warn('[Wayfinder] tool ' + cfg.name + ' dropped undeclared or unknown fields: ' + res.dropped.join(', '));
        return res;
    },

    _executeTableUpdate: function (cfg, args, context) {
        var sysId = this._clean(args.sys_id);
        if (!/^[0-9a-f]{32}$/.test(sysId)) return { ok: false, error: 'sys_id must be the 32-character sys_id of the record' };
        var gr = new GlideRecordSecure(cfg.table);
        if (!gr.isValid()) return { ok: false, error: 'target table does not exist: ' + cfg.table };
        if (!gr.get(sysId)) return { ok: false, error: 'record not found or no access' };
        if (!gr.canWrite()) return { ok: false, error: 'you do not have permission to update this record' };
        var w = this._collectWrites(cfg, args, gr, context.userId);
        if (!w.set.length) {
            return { ok: false, error: 'nothing to update' + (w.denied.length ? ' (no write access to: ' + w.denied.join(', ') + ')' : '') };
        }
        if (!gr.update()) return { ok: false, error: 'update failed: ' + (gr.getLastErrorMessage() || 'rejected by the platform') };
        var row = this._rowOut(gr, cfg.fields);
        row.updated_fields = w.set;
        if (w.denied.length) row.not_updated_no_access = w.denied;
        return { ok: true, data: row };
    },

    _executeTableCreate: function (cfg, args, context) {
        var gr = new GlideRecordSecure(cfg.table);
        if (!gr.isValid()) return { ok: false, error: 'target table does not exist: ' + cfg.table };
        gr.initialize();
        if (!gr.canCreate()) return { ok: false, error: 'you do not have permission to create records in ' + cfg.table };
        var w = this._collectWrites(cfg, args, gr, context.userId);
        if (!w.set.length) return { ok: false, error: 'no field values were supplied' };
        var id = gr.insert();
        if (!id) return { ok: false, error: 'create failed: ' + (gr.getLastErrorMessage() || 'rejected by the platform') };
        var row = this._rowOut(gr, cfg.fields);
        row.sys_id = String(id);
        row.created_fields = w.set;
        return { ok: true, data: row };
    },

    // ==== builtins ========================================================
    // To add one: write a _doFoo method, add a case here, then add a tool row
    // with kind=builtin and the same name.

    _executeBuiltin: function (cfg, args, context) {
        switch (cfg.name) {
            case 'search_knowledge':
                return this._doSearchKnowledge(args, context);
            case 'get_task':
                return this._doGetTask(args, context);
            case 'search_catalog':
                return this._doSearchCatalog(args, context);
            case 'get_catalog_item':
                return this._doGetCatalogItem(args, context);
            case 'submit_catalog_request':
                return this._doSubmitCatalogRequest(args, context);
            case 'escalate_to_agent':
                return this._doEscalateToAgent(args, context);
        }
        return { ok: false, error: 'no built-in handler named ' + cfg.name };
    },

    _clampInt: function (v, dflt, min, max) {
        var n = parseInt(v, 10);
        if (!(n > 0)) n = dflt;
        return Math.max(min, Math.min(max, n));
    },

    _portal: function () {
        var p = new x_snc_wayfinder_ai.WayfinderStore().prop('portal_suffix', 'esc').trim();
        return /^[A-Za-z0-9_\-]+$/.test(p) ? p : 'esc';
    },

    // ---- knowledge ----

    _doSearchKnowledge: function (args) {
        var q = this._clean(args.query);
        if (!q) return { ok: false, error: 'query is required' };
        var limit = this._clampInt(args.limit, 3, 1, 5);
        var gr = new GlideRecordSecure('kb_knowledge');
        gr.addQuery('workflow_state', 'published');
        gr.addQuery('active', true);
        gr.addQuery('123TEXTQUERY321', q);
        gr.setLimit(limit);
        gr.query();
        var results = [];
        while (gr.next()) {
            if (!gr.canRead()) continue;
            results.push({
                sys_id: gr.getUniqueValue(),
                number: gr.getValue('number'),
                short_description: gr.getValue('short_description'),
                excerpt: this._excerpt(gr.getValue('text'), q),
                url: '/kb_view.do?sys_kb_id=' + gr.getUniqueValue(),
            });
        }
        return { ok: true, data: { results: results, count: results.length } };
    },

    _stripHtml: function (html) {
        return String(html || '')
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#(\d+);/g, function (all, n) {
                return String.fromCharCode(parseInt(n, 10));
            })
            .replace(/&amp;/gi, '&')
            .replace(/\s+/g, ' ')
            .trim();
    },

    // Up to 900 chars, starting 200 chars before the earliest hit of any query word.
    _excerpt: function (html, query) {
        var text = this._stripHtml(html);
        var lower = text.toLowerCase();
        var words = String(query || '').toLowerCase().split(/[\s,.;:!?"'()\[\]{}]+/);
        var best = -1;
        var used = 0;
        for (var i = 0; i < words.length && used < 12; i++) {
            if (words[i].length < 2) continue;
            used++;
            var at = lower.indexOf(words[i]);
            if (at >= 0 && (best < 0 || at < best)) best = at;
        }
        var start = best > 200 ? best - 200 : 0;
        var end = Math.min(text.length, start + 900);
        var out = text.substring(start, end);
        if (start > 0) out = '…' + out;
        if (end < text.length) out = out + '…';
        return out;
    },

    // ---- tasks ----

    _taskNumberCandidates: function (n) {
        var s = String(n === null || n === undefined ? '' : n).toUpperCase().replace(/\s+/g, '');
        s = s.replace(/[^A-Z0-9_\-]/g, '').substring(0, 40);
        if (!s) return [];
        var out = [s];
        var m = /^([A-Z]+)0*(\d+)$/.exec(s);
        if (m) {
            var widths = [7, 10];
            for (var i = 0; i < widths.length; i++) {
                var digits = m[2];
                while (digits.length < widths[i]) digits = '0' + digits;
                var c = m[1] + digits;
                if (out.indexOf(c) === -1) out.push(c);
            }
        }
        return out;
    },

    _choicesFor: function (table, element) {
        var out = [];
        var gr = new GlideRecord('sys_choice');
        gr.addQuery('name', table);
        gr.addQuery('element', element);
        gr.addQuery('inactive', false);
        gr.addQuery('language', 'en');
        gr.orderBy('sequence');
        gr.query();
        while (gr.next()) out.push({ value: gr.getValue('value'), label: gr.getValue('label') });
        return out;
    },

    _taskChoices: function (cls) {
        var out = {};
        for (var i = 0; i < WayfinderTools.TASK_CHOICE_ELEMENTS.length; i++) {
            var el = WayfinderTools.TASK_CHOICE_ELEMENTS[i];
            var list = this._choicesFor(cls, el);
            if (!list.length && cls !== 'task') list = this._choicesFor('task', el);
            if (list.length) out[el] = list;
        }
        return out;
    },

    _doGetTask: function (args) {
        var candidates = this._taskNumberCandidates(args.number);
        if (!candidates.length) return { ok: false, error: 'number is required, with its prefix (for example INC0010001)' };
        var found = null;
        for (var i = 0; i < candidates.length && !found; i++) {
            var t = new GlideRecordSecure('task');
            t.addQuery('number', candidates[i]);
            t.setLimit(1);
            t.query();
            if (t.next() && t.canRead()) found = t;
        }
        if (!found) {
            return { ok: false, error: 'No task found that you can see. Tried: ' + candidates.join(', ') + '. Ask the user for the full number including its prefix (INC, CHG, PRB, REQ, RITM, TASK…).' };
        }
        var cls = found.getValue('sys_class_name') || 'task';
        var rec = new GlideRecordSecure(cls);
        if (!rec.isValid() || !rec.get(found.getUniqueValue())) rec = found;
        return {
            ok: true,
            data: {
                sys_id: rec.getUniqueValue(),
                number: rec.getValue('number'),
                type: cls,
                short_description: rec.getValue('short_description'),
                state: rec.getDisplayValue('state'),
                state_value: rec.getValue('state'),
                priority: rec.getDisplayValue('priority'),
                assigned_to: rec.getDisplayValue('assigned_to'),
                opened_at: rec.getDisplayValue('opened_at'),
                url: '/' + cls + '.do?sys_id=' + rec.getUniqueValue(),
                choices: this._taskChoices(cls),
            },
        };
    },

    // ---- catalog ----

    _buildCatalogQuery: function (q) {
        var clauses = ['123TEXTQUERY321=' + q];
        var words = q.split(/\s+/);
        var used = 0;
        for (var i = 0; i < words.length && used < 5; i++) {
            if (words[i].length < 3) continue;
            used++;
            clauses.push('ORnameLIKE' + words[i]);
            clauses.push('ORshort_descriptionLIKE' + words[i]);
        }
        return clauses.join('^') + '^active=true';
    },

    // Honors catalog user criteria where the sn_sc API is available.
    _canViewItem: function (id) {
        try {
            if (typeof sn_sc !== 'undefined' && sn_sc.CatItem) {
                var item = new sn_sc.CatItem(id);
                if (typeof item.canView === 'function') return !!item.canView(false, gs.getUserID());
            }
        } catch (e) {
            gs.debug('[Wayfinder] canView check unavailable: ' + e);
        }
        return true;
    },

    _doSearchCatalog: function (args) {
        var q = this._clean(args.query);
        var limit = this._clampInt(args.limit, 5, 1, 10);
        var gr = new GlideRecordSecure('sc_cat_item');
        if (q) {
            gr.addEncodedQuery(this._buildCatalogQuery(q));
        } else {
            gr.addQuery('active', true);
            gr.orderBy('name');
        }
        gr.setLimit(limit * 3);
        gr.query();
        var portal = this._portal();
        var results = [];
        while (gr.next() && results.length < limit) {
            if (!gr.canRead() || !this._bool(gr.getValue('active'))) continue;
            if (!this._canViewItem(gr.getUniqueValue())) continue;
            results.push({
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                short_description: gr.getValue('short_description'),
                category: gr.getDisplayValue('category'),
                catalogs: gr.getDisplayValue('sc_catalogs'),
                url: '/' + portal + '?id=sc_cat_item&sys_id=' + gr.getUniqueValue(),
            });
        }
        return { ok: true, data: { results: results, count: results.length, query: q } };
    },

    _getViewableItem: function (id) {
        if (!/^[0-9a-f]{32}$/.test(id)) return null;
        var item = new GlideRecordSecure('sc_cat_item');
        if (!item.get(id) || !item.canRead() || !this._bool(item.getValue('active'))) return null;
        if (!this._canViewItem(id)) return null;
        return item;
    },

    _mapVariableType: function (code) {
        return WayfinderTools.VARIABLE_TYPES[parseInt(code, 10)] || null;
    },

    _variableChoices: function (v, code) {
        var out = [];
        if (code === 18 || code === 22) {
            var table = v.getValue('lookup_table');
            var valueField = v.getValue('lookup_value') || 'sys_id';
            var labelField = v.getValue('lookup_label') || valueField;
            if (!table) return out;
            var lk = new GlideRecordSecure(table);
            if (!lk.isValid()) return out;
            lk.setLimit(50);
            lk.query();
            while (lk.next()) out.push({ value: String(lk.getValue(valueField)), label: String(lk.getDisplayValue(labelField.split(',')[0])) });
            return out;
        }
        var c = new GlideRecord('question_choice');
        c.addQuery('question', v.getUniqueValue());
        c.addQuery('inactive', false);
        c.orderBy('order');
        c.query();
        while (c.next()) out.push({ value: c.getValue('value'), label: c.getValue('text') });
        return out;
    },

    _variableOut: function (v) {
        var code = parseInt(v.getValue('type'), 10);
        var type = this._mapVariableType(code);
        if (!type) return null;
        var out = {
            name: v.getValue('name'),
            question: v.getValue('question_text') || v.getValue('name'),
            type: type,
            required: this._bool(v.getValue('mandatory')),
            help: this._stripHtml(v.getValue('help_text') || v.getValue('tooltip') || ''),
            order: parseFloat(v.getValue('order')) || 0,
        };
        if (v.getValue('default_value')) out['default'] = v.getValue('default_value');
        if (type === 'choice') out.choices = this._variableChoices(v, code);
        if (code === 8) out.reference_table = v.getValue('reference');
        if (code === 31) out.reference_table = 'sys_user';
        if (code === 21) out.reference_table = v.getValue('list_table');
        return out;
    },

    _doGetCatalogItem: function (args) {
        var id = this._clean(args.sys_id);
        var item = this._getViewableItem(id);
        if (!item) return { ok: false, error: 'catalog item not found or not available to you' };

        var rows = [];
        var seen = {};
        var collect = function (gr, self) {
            while (gr.next()) {
                if (seen[gr.getUniqueValue()]) continue;
                seen[gr.getUniqueValue()] = true;
                var out = self._variableOut(gr);
                if (out) rows.push(out);
            }
        };
        var direct = new GlideRecord('item_option_new');
        direct.addQuery('cat_item', id);
        direct.addQuery('active', true);
        direct.query();
        collect(direct, this);

        var setIds = [];
        var link = new GlideRecord('io_set_item');
        link.addQuery('sc_cat_item', id);
        link.orderBy('order');
        link.query();
        while (link.next()) setIds.push(link.getValue('variable_set'));
        if (setIds.length) {
            var inSets = new GlideRecord('item_option_new');
            inSets.addQuery('variable_set', 'IN', setIds.join(','));
            inSets.addQuery('active', true);
            inSets.query();
            collect(inSets, this);
        }
        rows.sort(function (a, b) {
            return a.order - b.order;
        });
        for (var i = 0; i < rows.length; i++) delete rows[i].order;

        return {
            ok: true,
            data: {
                sys_id: id,
                name: item.getValue('name'),
                short_description: item.getValue('short_description'),
                description: this._stripHtml(item.getValue('description')).substring(0, 2000),
                url: '/' + this._portal() + '?id=sc_cat_item&sys_id=' + id,
                variable_count: rows.length,
                variables: rows,
            },
        };
    },

    _doSubmitCatalogRequest: function (args) {
        var id = this._clean(args.catalog_item_sys_id);
        if (!this._getViewableItem(id)) return { ok: false, error: 'catalog item not found or not available to you' };
        var vars = args.variables;
        if (typeof vars === 'string') {
            try {
                vars = vars ? JSON.parse(vars) : {};
            } catch (e) {
                return { ok: false, error: 'variables must be a JSON object of variable name to value' };
            }
        }
        if (!vars || typeof vars !== 'object' || Array.isArray(vars)) vars = {};
        var clean = {};
        for (var k in vars) {
            if (!vars.hasOwnProperty(k)) continue;
            var v = vars[k];
            if (v === null || v === undefined) continue;
            clean[k] = typeof v === 'boolean' ? (v ? 'true' : 'false') : typeof v === 'object' ? JSON.stringify(v) : String(v);
        }
        var qty = this._clampInt(args.quantity, 1, 1, 20);

        var cart = new sn_sc.CartJS();
        var r = cart.orderNow({ sysparm_id: id, sysparm_quantity: String(qty), variables: clean }) || {};
        // The result shape differs across releases.
        var items = r.items || [];
        var requestId = String(r.request_id || r.sys_id || '');
        var requestNumber = String(r.request_number || r.number || '');
        var itemId = String(r.request_item_id || (items[0] && items[0].sys_id) || '');
        var itemNumber = String(r.request_item_number || (items[0] && items[0].number) || '');
        if (requestId && (!requestNumber || !itemNumber)) {
            var req = new GlideRecord('sc_request');
            if (!requestNumber && req.get(requestId)) requestNumber = req.getValue('number');
            var ritm = new GlideRecord('sc_req_item');
            ritm.addQuery('request', requestId);
            ritm.setLimit(1);
            ritm.query();
            if (ritm.next()) {
                itemId = itemId || ritm.getUniqueValue();
                itemNumber = itemNumber || ritm.getValue('number');
            }
        }
        if (!requestId) return { ok: false, error: 'the catalog did not return a request; check the item\'s mandatory variables' };
        return {
            ok: true,
            data: {
                request_id: requestId,
                request_number: requestNumber,
                request_item_id: itemId,
                request_item_number: itemNumber,
                url: '/' + this._portal() + '?id=ticket&table=sc_request&sys_id=' + requestId,
            },
        };
    },

    // ---- live agent ----

    _doEscalateToAgent: function (args, context) {
        var store = new x_snc_wayfinder_ai.WayfinderStore();
        if (store.prop('use_bot_api', 'false') !== 'true') {
            return { ok: false, error: 'Live-agent handoff is turned off on this instance. Offer the user another way to reach IT.' };
        }
        if (!context.conversationId) return { ok: false, error: 'escalation needs a chat conversation' };
        var conv = store.getOwnedConversation(context.conversationId, context.userId);
        if (!conv) return { ok: false, error: 'conversation not found' };
        if (conv.getValue('mode') === 'agent') {
            return { ok: true, data: { mode: 'agent', via: 'bot_api', message: 'The user is already in the live-agent queue.' } };
        }
        var topicId = store.prop('bot_api_live_agent_topic_sys_id').trim();
        if (!/^[0-9a-f]{32}$/.test(topicId)) {
            return { ok: false, error: 'Live-agent handoff is not set up (x_snc_wayfinder_ai.bot_api_live_agent_topic_sys_id is empty).' };
        }
        var bot = new x_snc_wayfinder_ai.WayfinderBotApiClient();
        if (!bot.isConfigured()) return { ok: false, error: 'Live-agent handoff is not set up (VA Bot API credentials are missing).' };
        // VA needs the user_name: a sys_id drops it into guest mode, and guests cannot be transferred.
        var userName = store.getUserName(context.userId);
        if (!userName) return { ok: false, error: 'could not resolve the user for the Virtual Agent session' };

        var sessionId = conv.getUniqueValue();
        var start = bot.send(sessionId, 'hi', userName, 'START_CONVERSATION', true);
        if (!start.ok) return { ok: false, error: 'Could not start the Virtual Agent session: ' + start.error };
        // Sending the topic sys_id untyped jumps straight into the Live Agent topic.
        // (Putting it in the START call falls through to the greeting topic instead.)
        var topic = bot.send(sessionId, topicId, userName, null, false);
        if (!topic.ok) return { ok: false, error: 'Could not open the Live Agent topic: ' + topic.error };

        conv.setValue('mode', 'agent');
        conv.update();
        gs.info('[Wayfinder] escalated conversation ' + sessionId + ' to live agent; topic=' + this._clean(args.topic) + ' team=' + this._clean(args.team));
        return {
            ok: true,
            data: {
                mode: 'agent',
                via: 'bot_api',
                message: "The user has been handed off to a live-agent queue. They are NOT connected yet — the banner above the chat will update when an agent picks up. They can keep typing; messages go to the agent.",
            },
        };
    },

    type: 'WayfinderTools',
};
