(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var SHOWN_TYPES = { OutputText: true, OutputCard: true, Boolean: true, Picker: true, Topic: true };
    var store = new x_snc_wayfinder_ai.WayfinderStore();

    // Constant-time comparison so the secret cannot be guessed byte by byte.
    function sameSecret(a, b) {
        a = String(a || '');
        b = String(b || '');
        var diff = a.length ^ b.length;
        for (var i = 0; i < a.length && i < b.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
        return diff === 0;
    }

    function reply(status, body) {
        response.setStatus(status);
        response.setBody(body);
    }

    var secret = store.prop('va_inbound_secret');
    if (!secret || !sameSecret(request.getHeader('x-wayfinder-secret'), secret)) {
        gs.warn('[Wayfinder] va_inbound rejected: missing or wrong X-Wayfinder-Secret header');
        return reply(401, { ok: false, error: 'unauthorized' });
    }

    var payload = null;
    try {
        payload = request.body ? request.body.data : null;
        if (typeof payload === 'string') payload = JSON.parse(payload);
    } catch (e) {
        payload = null;
    }
    if (!payload || !payload.clientSessionId) return reply(400, { ok: false, error: 'clientSessionId is required' });

    var conv = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_CONVERSATION);
    if (!/^[0-9a-f]{32}$/.test(String(payload.clientSessionId)) || !conv.get(String(payload.clientSessionId)) || conv.getValue('mode') !== 'agent') {
        // Stale or unknown callbacks are dropped quietly.
        return reply(200, { ok: true, ignored: true });
    }

    var agent = payload.agent || {};
    var agentName = String(agent.name || agent.displayName || '').substring(0, 100);
    var items = Array.isArray(payload.body) ? payload.body : [];
    var appended = 0;
    for (var i = 0; i < items.length; i++) {
        var item = items[i] || {};
        if (!SHOWN_TYPES[item.uiType]) continue;
        var text = String(item.value || item.label || '').trim();
        if (!text) continue;
        store.insertMessage(conv.getUniqueValue(), 'assistant', text.substring(0, 60000), agentName ? { source: 'agent', agentName: agentName } : {});
        appended++;
    }

    var ended = payload.completed === true || payload.takeControl === true;
    if (ended) {
        conv.setValue('mode', 'ai');
        conv.update();
    }
    gs.info('[Wayfinder] va_inbound conversation=' + conv.getUniqueValue() + ' appended=' + appended + (agentName ? ' agent=' + agentName : '') + (ended ? ' ended' : ''));
    return reply(200, { ok: true, appended: appended });
})(request, response);
