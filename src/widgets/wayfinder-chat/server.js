(function () {
    /* Every action is scoped to the signed-in user: conversations, jobs and messages
       are only returned or changed after an ownership check. */
    var store = new x_snc_wayfinder_ai.WayfinderStore();
    var me = gs.getUserID();
    var MAX_MESSAGE = 8000;

    data.ok = true;
    data.error = '';

    if (!input || !input.action) {
        data.messages = [];
        data.conversation_id = null;
        data.conversations = store.listConversations(me);
        return;
    }

    function fail(msg) {
        data.ok = false;
        data.error = msg;
    }

    function conversationPayload(conv) {
        var id = conv.getUniqueValue();
        data.conversation_id = id;
        data.mode = conv.getValue('mode') || 'ai';
        data.messages = store.loadMessages(id);
        if (data.mode === 'agent') data.agent_status = store.deriveAgentStatus(id);
        // Lets the client restore an Approve / Cancel card after a reload.
        data.pending_job = store.getPendingJob(id);
    }

    try {
        var action = String(input.action);
        var conv, owned;

        if (action === 'send') {
            var text = String(input.message || '').trim();
            if (!text) return fail('Type a message first.');
            if (text.length > MAX_MESSAGE) return fail('That message is too long (max ' + MAX_MESSAGE + ' characters).');
            if (!me || !gs.isLoggedIn()) return fail('Sign in to use Wayfinder.');

            conv = input.conversation_id ? store.getOwnedConversation(input.conversation_id, me) : null;
            if (!conv) conv = store.createConversation(me);
            data.conversation_id = conv.getUniqueValue();

            if (conv.getValue('mode') === 'agent') {
                store.insertMessage(conv.getUniqueValue(), 'user', text);
                var userName = store.getUserName(me);
                var sent = new x_snc_wayfinder_ai.WayfinderBotApiClient().send(conv.getUniqueValue(), text, userName, null, true);
                data.mode = 'agent';
                data.agent_send_ok = sent.ok;
                if (!sent.ok) data.agent_send_error = sent.error;
                return;
            }

            if (store.hasActiveJob(conv.getUniqueValue())) return fail('Wayfinder is still working on your last message. Wait for it to finish, then send again.');
            var job = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_JOB);
            job.initialize();
            job.setValue('conversation', conv.getUniqueValue());
            job.setValue('user_message', text);
            job.setValue('status', 'new');
            var jobId = job.insert();
            if (!jobId) return fail('Could not start the reply: ' + (job.getLastErrorMessage() || 'insert failed') + '. Check the System Log for "Wayfinder".');
            data.job_sys_id = String(jobId);
            data.mode = 'ai';
            return;
        }

        if (action === 'poll') {
            owned = store.getOwnedJob(input.job_sys_id, me);
            if (!owned) return fail('not found');
            var j = owned.job;
            data.status = j.getValue('status');
            data.content = j.getValue('content') || '';
            data.last_tool = j.getValue('last_tool') || '';
            data.error = j.getValue('error_message') || '';
            if (data.status === 'complete' || data.status === 'error') {
                conversationPayload(owned.conversation);
                data.conversations = store.listConversations(me);
            } else if (data.status === 'awaiting_confirmation') {
                data.pending = x_snc_wayfinder_ai.WayfinderStore.parseJson(j.getValue('pending_tool_calls'), []) || [];
                conversationPayload(owned.conversation);
            }
            return;
        }

        if (action === 'confirm') {
            owned = store.getOwnedJob(input.job_sys_id, me);
            if (!owned) return fail('not found');
            if (owned.job.getValue('status') !== 'awaiting_confirmation') return fail('This action is no longer waiting for approval.');
            var approved = input.approved === true || input.approved === 'true';
            owned.job.setValue('status', approved ? 'confirmed' : 'cancelled');
            owned.job.update();
            data.status = owned.job.getValue('status');
            return;
        }

        if (action === 'agent_poll' || action === 'load_conversation') {
            conv = store.getOwnedConversation(input.conversation_id, me);
            if (!conv) return fail('not found');
            conversationPayload(conv);
            return;
        }

        if (action === 'cancel_agent_chat') {
            conv = store.getOwnedConversation(input.conversation_id, me);
            if (!conv) return fail('not found');
            if (conv.getValue('mode') === 'agent') {
                new x_snc_wayfinder_ai.WayfinderBotApiClient().send(conv.getUniqueValue(), 'bye', store.getUserName(me), 'END_CONVERSATION', true);
                conv.setValue('mode', 'ai');
                conv.update();
            }
            data.cancelled = true;
            conversationPayload(conv);
            return;
        }

        if (action === 'list_conversations') {
            data.conversations = store.listConversations(me);
            return;
        }

        if (action === 'delete_conversation') {
            conv = store.getOwnedConversation(input.conversation_id, me);
            if (!conv) return fail('not found');
            var busy = new GlideRecord(x_snc_wayfinder_ai.WayfinderStore.T_JOB);
            busy.addQuery('conversation', conv.getUniqueValue());
            busy.addQuery('status', 'IN', 'running,tool_call');
            busy.setLimit(1);
            busy.query();
            if (busy.hasNext()) return fail('Wayfinder is still working in this chat. Try again when it finishes.');
            store.deleteConversation(conv.getUniqueValue());
            data.deleted = true;
            data.conversations = store.listConversations(me);
            return;
        }

        fail('Unknown action.');
    } catch (e) {
        gs.error('[Wayfinder] chat widget action ' + input.action + ' failed: ' + (e && e.message ? e.message : e));
        fail('Something went wrong. Check the System Log for "Wayfinder".');
    }
})();
