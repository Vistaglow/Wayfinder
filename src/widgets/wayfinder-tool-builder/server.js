(function () {
    /* Tool builder. Reads are open to signed-in users (the tool catalog is readable),
       every change and the Test panel require the Wayfinder admin role, checked here. */
    var T_TOOL = x_snc_wayfinder_ai.WayfinderStore.T_TOOL;
    var NAME_RE = /^[a-z_][a-z0-9_]*$/;
    var PARAM_TYPES = { string: true, integer: true, number: true, boolean: true, object: true };
    var HIDDEN_FIELDS = { sys_mod_count: true, sys_domain: true, sys_domain_path: true, sys_overrides: true, sys_package: true, sys_policy: true, sys_scope: true, sys_update_name: true };
    var POPULAR = [
        { name: 'task', label: 'Task' },
        { name: 'incident', label: 'Incident' },
        { name: 'change_request', label: 'Change Request' },
        { name: 'problem', label: 'Problem' },
        { name: 'sc_request', label: 'Request' },
        { name: 'sc_req_item', label: 'Requested Item' },
        { name: 'sc_cat_item', label: 'Catalog Item' },
        { name: 'kb_knowledge', label: 'Knowledge' },
        { name: 'sys_user', label: 'User' },
        { name: 'sys_user_group', label: 'Group' },
        { name: 'cmdb_ci', label: 'Configuration Item' },
    ];

    var isAdmin = gs.hasRole('x_snc_wayfinder_ai.admin');
    data.is_admin = isAdmin;
    data.ok = true;
    data.error = '';

    function fail(msg) {
        data.ok = false;
        data.error = msg;
    }

    function requireAdmin() {
        if (isAdmin) return true;
        fail('Only Wayfinder admins can change or test tools.');
        return false;
    }

    function listTools() {
        var out = [];
        var gr = new GlideRecord(T_TOOL);
        gr.orderBy('name');
        gr.query();
        while (gr.next()) {
            var d = gr.getValue('description') || '';
            out.push({
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('name'),
                description: d.length > 120 ? d.substring(0, 117) + '…' : d,
                kind: gr.getValue('kind'),
                operation: gr.getValue('operation'),
                target_table: gr.getValue('target_table') || '',
                enabled: gr.getValue('enabled') === '1' || gr.getValue('enabled') === 'true',
                require_confirmation: gr.getValue('require_confirmation') === '1' || gr.getValue('require_confirmation') === 'true',
            });
        }
        return out;
    }

    function toolOut(gr) {
        var cfg = new x_snc_wayfinder_ai.WayfinderTools().normalizeConfig({
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
        return {
            sys_id: cfg.sys_id,
            name: cfg.name,
            description: cfg.description,
            enabled: cfg.enabled,
            kind: cfg.kind,
            operation: cfg.operation,
            parameters: cfg.params,
            parameters_error: cfg.parseError,
            target_table: cfg.table,
            encoded_query_template: cfg.template,
            fields: cfg.fields,
            limit: cfg.limit,
            require_confirmation: cfg.requireConfirmation,
        };
    }

    // Validates and normalizes the client's draft. Returns {draft} or {error}.
    function validateDraft(t) {
        t = t || {};
        var name = String(t.name || '').trim();
        if (!name) return { error: 'Name is required.' };
        if (!NAME_RE.test(name) || name.length > 80) return { error: 'Name must be snake_case: lowercase letters, digits and underscores, starting with a letter or underscore.' };
        var description = String(t.description || '').trim();
        if (!description) return { error: 'Description is required: the AI reads it to decide when to call the tool.' };
        var kind = t.kind === 'builtin' ? 'builtin' : 'table';
        var op = t.operation === 'update' || t.operation === 'create' ? t.operation : 'read';
        var table = String(t.target_table || '').trim();
        if (kind === 'table') {
            if (!/^[a-z0-9_]+$/.test(table)) return { error: 'Choose the table this tool works on.' };
            if (!new GlideRecord(table).isValid()) return { error: 'Table ' + table + ' does not exist.' };
        }
        var params = [];
        var seen = {};
        var list = Array.isArray(t.parameters) ? t.parameters : [];
        for (var i = 0; i < list.length; i++) {
            var p = list[i] || {};
            var pn = String(p.name || '').trim();
            if (!pn) continue;
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(pn)) return { error: 'Parameter "' + pn + '" must use letters, digits and underscores only.' };
            if (seen[pn]) return { error: 'Parameter "' + pn + '" is listed twice.' };
            seen[pn] = true;
            var type = PARAM_TYPES[p.type] ? p.type : 'string';
            var out = { name: pn, type: type, description: String(p.description || '').substring(0, 1000), required: p.required === true };
            if (p.raw_query === true) out.raw_query = true;
            params.push(out);
        }
        var fields = [];
        var f = Array.isArray(t.fields) ? t.fields : String(t.fields || '').split(',');
        for (var j = 0; j < f.length; j++) {
            var fn = String(f[j] || '').trim();
            if (fn && /^[a-z0-9_.]+$/.test(fn) && fields.indexOf(fn) === -1) fields.push(fn);
        }
        if (!fields.length) fields = ['sys_id'];
        var limit = parseInt(t.limit, 10);
        if (!(limit >= 1 && limit <= 50)) limit = 10;
        return {
            draft: {
                sys_id: t.sys_id || '',
                name: name,
                description: description.substring(0, 4000),
                enabled: t.enabled !== false,
                kind: kind,
                operation: op,
                parameters: params,
                parameters_json: JSON.stringify(params),
                target_table: kind === 'table' ? table : '',
                encoded_query_template: op === 'read' ? String(t.encoded_query_template || '').replace(/[\r\n]+/g, '').substring(0, 4000) : '',
                return_fields: fields.join(','),
                max_results: limit,
                require_confirmation: t.require_confirmation === true,
            },
        };
    }

    function tableHierarchy(table) {
        var chain = [];
        var name = table;
        while (name && chain.length < 10) {
            chain.push(name);
            var db = new GlideRecord('sys_db_object');
            db.addQuery('name', name);
            db.setLimit(1);
            db.query();
            if (!db.next()) break;
            var parent = db.super_class.name ? String(db.super_class.name) : '';
            name = parent && chain.indexOf(parent) === -1 ? parent : '';
        }
        return chain;
    }

    if (!input || !input.action) {
        data.popular_tables = POPULAR;
        data.tools = listTools();
        return;
    }

    try {
        var action = String(input.action);
        var gr;

        if (action === 'list_tools') {
            data.tools = listTools();
            return;
        }

        if (action === 'get_tool') {
            gr = new GlideRecord(T_TOOL);
            if (!gr.get(String(input.sys_id || ''))) return fail('Tool not found.');
            data.tool = toolOut(gr);
            return;
        }

        if (action === 'save_tool') {
            if (!requireAdmin()) return;
            var v = validateDraft(input.tool);
            if (v.error) return fail(v.error);
            var d = v.draft;
            gr = new GlideRecord(T_TOOL);
            var isNew = !(d.sys_id && gr.get(String(d.sys_id)));
            if (isNew) {
                var dup = new GlideRecord(T_TOOL);
                dup.addQuery('name', d.name);
                dup.setLimit(1);
                dup.query();
                if (dup.hasNext()) return fail('A tool named ' + d.name + ' already exists.');
                gr.initialize();
                gr.setValue('name', d.name);
                gr.setValue('kind', d.kind);
            }
            var builtin = gr.getValue('kind') === 'builtin';
            gr.setValue('description', d.description);
            gr.setValue('enabled', d.enabled);
            gr.setValue('parameters_json', d.parameters_json);
            gr.setValue('require_confirmation', d.require_confirmation);
            if (!builtin) {
                // Runtime behavior of built-ins lives in code; only the description and parameters are editable.
                gr.setValue('operation', d.operation);
                gr.setValue('target_table', d.target_table);
                gr.setValue('encoded_query_template', d.encoded_query_template);
                gr.setValue('return_fields', d.return_fields);
                gr.setValue('max_results', d.max_results);
            }
            var id = isNew ? gr.insert() : gr.update();
            if (!id) return fail('Could not save: ' + (gr.getLastErrorMessage() || 'rejected by the platform'));
            gs.info('[Wayfinder] tool ' + d.name + (isNew ? ' created' : ' updated') + ' by ' + gs.getUserName());
            data.saved_sys_id = gr.getUniqueValue();
            data.tools = listTools();
            return;
        }

        if (action === 'delete_tool') {
            if (!requireAdmin()) return;
            gr = new GlideRecord(T_TOOL);
            if (!gr.get(String(input.sys_id || ''))) return fail('Tool not found.');
            var deletedName = gr.getValue('name');
            if (!gr.deleteRecord()) return fail('Could not delete: ' + (gr.getLastErrorMessage() || 'rejected by the platform'));
            gs.info('[Wayfinder] tool ' + deletedName + ' deleted by ' + gs.getUserName());
            data.tools = listTools();
            return;
        }

        if (action === 'list_tables') {
            var q = String(input.query || '').replace(/[\^\r\n]/g, '').trim();
            if (!q) {
                data.tables = POPULAR;
                return;
            }
            data.tables = [];
            var db = new GlideRecord('sys_db_object');
            db.addQuery('name', 'CONTAINS', q).addOrCondition('label', 'CONTAINS', q);
            db.orderBy('name');
            db.setLimit(20);
            db.query();
            while (db.next()) data.tables.push({ name: db.getValue('name'), label: db.getValue('label') || db.getValue('name') });
            return;
        }

        if (action === 'list_fields') {
            var table = String(input.table || '');
            if (!/^[a-z0-9_]+$/.test(table) || !new GlideRecord(table).isValid()) return fail('Unknown table.');
            var chain = tableHierarchy(table);
            var seenEl = {};
            data.fields = [];
            // Most specific table first, so its dictionary entry wins over inherited ones.
            for (var c = 0; c < chain.length; c++) {
                var dict = new GlideRecord('sys_dictionary');
                dict.addQuery('name', chain[c]);
                dict.addQuery('active', true);
                dict.addNotNullQuery('element');
                dict.orderBy('column_label');
                dict.query();
                while (dict.next()) {
                    var el = dict.getValue('element');
                    if (!el || seenEl[el] || HIDDEN_FIELDS[el]) continue;
                    seenEl[el] = true;
                    data.fields.push({
                        element: el,
                        label: dict.getValue('column_label') || el,
                        type: dict.getValue('internal_type') || 'string',
                        reference: dict.getValue('reference') || '',
                        mandatory: dict.getValue('mandatory') === '1' || dict.getValue('mandatory') === 'true',
                    });
                }
            }
            data.fields.sort(function (a, b) {
                return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : a.label.toLowerCase() > b.label.toLowerCase() ? 1 : 0;
            });
            return;
        }

        if (action === 'test_tool') {
            if (!requireAdmin()) return;
            var tv = validateDraft(input.tool);
            if (tv.error) return fail(tv.error);
            var tools = new x_snc_wayfinder_ai.WayfinderTools();
            var cfg = tools.normalizeConfig(tv.draft);
            // The test bypasses the confirmation gate on purpose; the UI warns about writes.
            data.result = tools.executeConfig(cfg, input.args || {}, { userId: gs.getUserID() });
            return;
        }

        fail('Unknown action.');
    } catch (e) {
        gs.error('[Wayfinder] tool builder action ' + input.action + ' failed: ' + (e && e.message ? e.message : e));
        fail('Something went wrong. Check the System Log for "Wayfinder".');
    }
})();
