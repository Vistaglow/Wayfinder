var WayfinderBotApiClient = Class.create();
WayfinderBotApiClient.prototype = {
    initialize: function () {
        var store = new x_snc_wayfinder_ai.WayfinderStore();
        this.user = store.prop('bot_api_basic_user').trim();
        this.password = store.prop('bot_api_basic_password');
        this.token = store.prop('bot_api_token').trim();
        this.timeoutMs = parseInt(store.prop('bot_api_timeout_ms', '30000'), 10) || 30000;
        var base = String(gs.getProperty('glide.servlet.uri', '') || '').replace(/\/+$/, '');
        this.url = base + '/api/sn_va_as_service/bot/integration';
    },

    isConfigured: function () {
        return !!(this.user && this.password);
    },

    // sessionId: the Wayfinder conversation sys_id (pairs threads with VA sessions).
    // userId: sys_user.user_name (a sys_id puts VA into guest mode).
    // Returns {ok, status, body, error}. Never throws.
    send: function (sessionId, text, userId, action, typed) {
        if (!this.isConfigured()) {
            return { ok: false, status: 0, body: null, error: 'VA Bot API Basic Auth is not configured (x_snc_wayfinder_ai.bot_api_basic_user / bot_api_basic_password).' };
        }
        try {
            var payload = {
                requestId: gs.generateGUID(),
                clientSessionId: String(sessionId),
                clientMessageId: gs.generateGUID(),
                userId: String(userId || ''),
                emailId: '',
                message: { text: String(text === null || text === undefined ? '' : text), typed: typed !== false },
            };
            if (action) payload.action = action;
            if (this.token) payload.token = this.token;

            var rm = new sn_ws.RESTMessageV2();
            rm.setEndpoint(this.url);
            rm.setHttpMethod('post');
            rm.setBasicAuth(this.user, this.password);
            rm.setRequestHeader('Content-Type', 'application/json');
            rm.setRequestHeader('Accept', 'application/json');
            // Instances differ in whether they honor the header or the body field, so send both.
            if (this.token) rm.setRequestHeader('token', this.token);
            rm.setHttpTimeout(this.timeoutMs);
            rm.setRequestBody(JSON.stringify(payload));

            var resp = rm.execute();
            var status = resp.getStatusCode();
            var raw = String(resp.getBody() || '');
            var body = raw;
            try {
                body = raw ? JSON.parse(raw) : null;
            } catch (e) {
                // keep the raw text
            }
            var ok = status >= 200 && status < 300;
            return {
                ok: ok,
                status: status,
                body: body,
                error: ok ? '' : 'VA Bot API returned HTTP ' + status + (status ? '' : ': ' + resp.getErrorMessage()),
            };
        } catch (ex) {
            return { ok: false, status: 0, body: null, error: 'VA Bot API call failed: ' + (ex && ex.message ? ex.message : ex) };
        }
    },

    type: 'WayfinderBotApiClient',
};
