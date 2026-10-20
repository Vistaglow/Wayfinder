(function (outputs, steps, params, stepResult, assertEqual) {
    // Runs as the impersonated no-role user. Plain GlideRecord (no ACLs) is used
    // only to set up and clean up the probe record.
    var me = gs.getUserID();
    var admin = new GlideRecord('sys_user');
    admin.addQuery('user_name', 'admin');
    admin.setLimit(1);
    admin.query();
    var otherUser = admin.next() ? admin.getUniqueValue() : '';

    var inc = new GlideRecord('incident');
    inc.initialize();
    inc.setValue('short_description', 'Wayfinder ACL probe - safe to delete');
    inc.setValue('caller_id', otherUser);
    inc.setValue('opened_by', otherUser);
    var incId = inc.insert();
    var number = inc.getValue('number');
    var failures = [];

    try {
        var tools = new x_snc_wayfinder_ai.WayfinderTools();
        var ctx = { userId: me };

        // 1. get_task must not reveal a ticket the user cannot read.
        var getTask = tools.normalizeConfig({ name: 'get_task', kind: 'builtin', parameters: [{ name: 'number', required: true }] });
        var r1 = tools.executeConfig(getTask, { number: number }, ctx);
        if (r1.ok) failures.push('get_task returned ' + number + ' to a user without read access');

        // 2. A generic read tool must return no rows for it.
        var search = tools.normalizeConfig({
            name: 'probe_search',
            kind: 'table',
            operation: 'read',
            target_table: 'incident',
            encoded_query_template: '{query}',
            return_fields: 'number,short_description',
            parameters: [{ name: 'query', raw_query: true }],
        });
        var r2 = tools.executeConfig(search, { query: 'sys_id=' + incId }, ctx);
        if (!r2.ok || r2.data.count !== 0) failures.push('table read returned rows the user cannot read: ' + JSON.stringify(r2));

        // 3. Model-supplied values cannot widen a fixed filter.
        var byCaller = tools.normalizeConfig({
            name: 'probe_mine',
            kind: 'table',
            operation: 'read',
            target_table: 'incident',
            encoded_query_template: 'caller_id={user_sys_id}^number={n}',
            return_fields: 'number',
            parameters: [{ name: 'n' }],
        });
        var r3 = tools.executeConfig(byCaller, { n: 'X^NQsys_id=' + incId }, ctx);
        if (!r3.ok || r3.data.count !== 0 || /\^NQ/.test(r3.data.query)) failures.push('injection widened the query: ' + JSON.stringify(r3));
        var r4 = tools.executeConfig(search, { query: 'active=false^NQsys_id=' + incId }, ctx);
        if (r4.ok) failures.push('raw query with ^NQ was accepted');

        // 4. Write tools that change data are behind the approval gate.
        var gate = tools.getConfirmationMap();
        var needGate = ['submit_catalog_request', 'escalate_to_agent', 'update_task'];
        for (var i = 0; i < needGate.length; i++) {
            var t = new GlideRecord('x_snc_wayfinder_ai_tool');
            if (t.get('name', needGate[i]) && tools._bool(t.getValue('enabled')) && !gate[needGate[i]]) {
                failures.push(needGate[i] + ' is enabled without "Ask for approval before running"');
            }
        }
    } finally {
        var cleanup = new GlideRecord('incident');
        if (incId && cleanup.get(incId)) cleanup.deleteRecord();
    }

    stepResult.setOutputMessage(failures.length ? 'FAILED:\n' + failures.join('\n') : 'All Wayfinder ACL checks passed for probe ' + number);
    return failures.length === 0;
})(outputs, steps, params, stepResult, assertEqual);
