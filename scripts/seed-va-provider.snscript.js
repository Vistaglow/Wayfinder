/*
 * Wayfinder - one-time Virtual Agent provider setup (live-agent handoff).
 *
 * Run in System Definition > Scripts - Background, scope: global, as an admin.
 * Safe to re-run: rows are found by name / inbound id and updated, not duplicated.
 * Version-tolerant: every column is checked in sys_dictionary before it is set.
 *
 * Afterwards:
 *   1. Open the provider's outbound auth and replace the CHANGE_ME password.
 *   2. Make sure the provider sends the header  X-Wayfinder-Secret: <value of x_snc_wayfinder_ai.va_inbound_secret>.
 *   3. Copy the printed token into x_snc_wayfinder_ai.bot_api_token.
 *   4. Check that the "Live Agent Support" topic's transfer node uses this provider,
 *      and copy that topic's sys_id into x_snc_wayfinder_ai.bot_api_live_agent_topic_sys_id.
 */
(function () {
    var NAME = 'Wayfinder External Bot';
    var INBOUND_ID = 'wayfinder_bot';
    var CHANNEL_TABLE = 'sys_cs_provider_application';
    var instance = String(gs.getProperty('glide.servlet.uri', '')).replace(/\/+$/, '');
    var OUTBOUND_URL = instance + '/api/x_snc_wayfinder_ai/wayfinder/va_inbound';

    function hasTable(t) {
        return new GlideRecord(t).isValid();
    }
    function hasColumn(table, col) {
        var d = new GlideRecord('sys_dictionary');
        d.addQuery('name', table);
        d.addQuery('element', col);
        d.setLimit(1);
        d.query();
        return d.hasNext();
    }
    // Sets the first candidate column that exists; returns its name or ''.
    function setFirst(gr, table, candidates, value) {
        for (var i = 0; i < candidates.length; i++) {
            if (hasColumn(table, candidates[i])) {
                gr.setValue(candidates[i], value);
                return candidates[i];
            }
        }
        return '';
    }
    function upsert(table, keys, apply) {
        var gr = new GlideRecord(table);
        for (var k in keys) if (keys.hasOwnProperty(k) && hasColumn(table, k)) gr.addQuery(k, keys[k]);
        gr.setLimit(1);
        gr.query();
        var exists = gr.next();
        if (!exists) {
            gr.initialize();
            for (var k2 in keys) if (keys.hasOwnProperty(k2) && hasColumn(table, k2)) gr.setValue(k2, keys[k2]);
        }
        apply(gr);
        var id = exists ? gr.update() : gr.insert();
        gs.print((id ? (exists ? '[update] ' : '[create] ') : '[FAIL] ') + table + ' ' + (id || gr.getLastErrorMessage()));
        return id ? gr.getUniqueValue() : '';
    }

    if (!hasTable(CHANNEL_TABLE)) {
        gs.print('[FAIL] ' + CHANNEL_TABLE + ' does not exist. Activate Virtual Agent and Conversational Integration first.');
        return;
    }

    // Discover the provider table through the channel table's provider reference.
    var providerTable = '';
    var providerField = '';
    var d = new GlideRecord('sys_dictionary');
    d.addQuery('name', CHANNEL_TABLE);
    d.addQuery('internal_type', 'reference');
    d.addQuery('element', 'CONTAINS', 'provider');
    d.setLimit(1);
    d.query();
    if (d.next()) {
        providerField = d.getValue('element');
        providerTable = d.getValue('reference');
    }

    function applyOutbound(gr, table) {
        var urlCol = setFirst(gr, table, ['outbound_url', 'outbound_api', 'endpoint', 'webhook_url', 'callback_url'], OUTBOUND_URL);
        var userCol = setFirst(gr, table, ['outbound_user', 'user'], 'wayfinder.va.outbound');
        var passCol = setFirst(gr, table, ['outbound_password', 'password'], 'CHANGE_ME');
        setFirst(gr, table, ['outbound_auth_type', 'auth_type'], 'basic');
        gs.print('  outbound columns on ' + table + ': url=' + (urlCol || '-') + ' user=' + (userCol || '-') + ' password=' + (passCol || '-'));
    }

    var providerId = '';
    if (providerTable && hasTable(providerTable)) {
        providerId = upsert(providerTable, { name: NAME }, function (gr) {
            setFirst(gr, providerTable, ['active'], true);
            applyOutbound(gr, providerTable);
        });
    } else {
        gs.print('[info] no provider table found; outbound settings go on the channel row');
    }

    var channelId = upsert(CHANNEL_TABLE, { name: NAME, inbound_id: INBOUND_ID }, function (gr) {
        setFirst(gr, CHANNEL_TABLE, ['active'], true);
        if (providerId && providerField) gr.setValue(providerField, providerId);
        setFirst(gr, CHANNEL_TABLE, ['portal', 'default_portal'], 'esc');
        if (!providerId) applyOutbound(gr, CHANNEL_TABLE);
    });

    // Token used by the Bot Integration API.
    var tokenId = '';
    if (hasTable('token_verification')) {
        tokenId = upsert('token_verification', { name: NAME }, function (gr) {
            if (!gr.getValue('token')) setFirst(gr, 'token_verification', ['token'], gs.generateGUID() + gs.generateGUID());
        });
        var tok = new GlideRecord('token_verification');
        if (tokenId && tok.get(tokenId)) gs.print('  token (copy into x_snc_wayfinder_ai.bot_api_token): ' + tok.getValue('token'));
    }

    gs.print('provider: ' + (providerTable || '-') + ' ' + (providerId || '-'));
    gs.print('channel identity: ' + CHANNEL_TABLE + ' ' + (channelId || '-'));
    gs.print('outbound URL: ' + OUTBOUND_URL);
})();
