var WayfinderAzureClient = Class.create();
WayfinderAzureClient.prototype = {
    initialize: function () {
        var store = new x_snc_wayfinder_ai.WayfinderStore();
        this.endpoint = store.prop('azure_endpoint').trim().replace(/\/+$/, '');
        this.deployment = store.prop('azure_deployment').trim();
        this.apiVersion = store.prop('azure_api_version', '2024-08-01-preview').trim();
        this.apiKey = store.prop('azure_api_key').trim();
        this.timeoutMs = parseInt(store.prop('azure_timeout_ms', '120000'), 10) || 120000;
        // Empty = don't send temperature. Reasoning models (gpt-5 family, o-series)
        // reject any value other than their default.
        this.temperature = parseFloat(store.prop('azure_temperature').trim());
    },

    // messages: OpenAI-shape array. tools: array of function definitions (may be empty).
    // Returns {content: string, tool_calls: array|null}. Throws on any failure.
    complete: function (messages, tools) {
        if (!this.endpoint || !this.deployment || !this.apiKey) {
            throw new Error('Wayfinder is not configured: set the x_snc_wayfinder_ai.azure_endpoint, azure_deployment and azure_api_key properties.');
        }
        if (!/^https:\/\/[^\/\s]+/i.test(this.endpoint) || this.endpoint.indexOf('YOUR-RESOURCE') !== -1) {
            throw new Error('x_snc_wayfinder_ai.azure_endpoint must be your https:// Azure OpenAI endpoint.');
        }
        var url = this.endpoint + '/openai/deployments/' + encodeURIComponent(this.deployment) +
            '/chat/completions?api-version=' + encodeURIComponent(this.apiVersion);
        var body = { messages: messages, stream: false };
        if (!isNaN(this.temperature)) body.temperature = this.temperature;
        if (tools && tools.length) body.tools = tools;

        var rm = new sn_ws.RESTMessageV2();
        rm.setEndpoint(url);
        rm.setHttpMethod('post');
        this._applyAuth(rm);
        rm.setRequestHeader('Content-Type', 'application/json');
        rm.setRequestHeader('Accept', 'application/json');
        rm.setHttpTimeout(this.timeoutMs);
        rm.setRequestBody(JSON.stringify(body));

        var resp = rm.execute();
        var status = resp.getStatusCode();
        var text = String(resp.getBody() || '');
        if (!status) {
            throw new Error('Azure request failed: ' + this._scrub(String(resp.getErrorMessage() || 'no response')));
        }
        if (status < 200 || status >= 300) {
            throw new Error('Azure returned HTTP ' + status + ': ' + this._scrub(text.substring(0, 400)));
        }
        var parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            throw new Error('Azure returned a non-JSON response: ' + this._scrub(text.substring(0, 200)));
        }
        var choice = parsed && parsed.choices && parsed.choices[0];
        var msg = (choice && choice.message) || {};
        return {
            content: msg.content ? String(msg.content) : '',
            tool_calls: msg.tool_calls && msg.tool_calls.length ? msg.tool_calls : null,
        };
    },

    // The only place auth headers are built. To move to Entra ID, fetch a
    // client-credentials token here and set "Authorization: Bearer <token>" instead.
    _applyAuth: function (rm) {
        rm.setRequestHeader('api-key', this.apiKey);
    },

    // Never let a key fragment reach a log, a job row or the chat.
    _scrub: function (text) {
        var s = String(text || '');
        if (this.apiKey) s = s.split(this.apiKey).join('[redacted]');
        return s.replace(/[A-Za-z0-9+\/_\-]{32,}/g, '[redacted]');
    },

    type: 'WayfinderAzureClient',
};
