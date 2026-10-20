api.controller = function ($scope, $sce, $timeout, $window) {
    var c = this;

    var POLL_MS = 750;
    var POLL_RETRY_MS = 1500;
    var AGENT_POLL_MS = 2000;
    var AGENT_RETRY_MS = 4000;
    var MAX_FAILURES = 5;
    var TASK_TABLES = {
        INC: 'incident',
        CHG: 'change_request',
        PRB: 'problem',
        REQ: 'sc_request',
        RITM: 'sc_req_item',
        TASK: 'task',
        CTASK: 'change_task',
        PTASK: 'problem_task',
    };
    // One pass, so anchors never nest: markdown link | bare URL | task number.
    var LINK_RE = /\[([^\]]+)\]\(((?:https?:\/\/|\/(?!\/))[^)\s"]+)\)|(https?:\/\/[^\s<"]+)|\b([A-Z]{3,5})(\d{6,})\b/g;

    c.input = '';
    c.busy = false;
    c.status = '';
    c.lastTool = '';
    c.error = '';
    c.mode = 'ai';
    c.agentStatus = null;
    c.messages = [];
    c.conversations = (c.data && c.data.conversations) || [];
    c.conversationId = null;
    c.pending = null;
    c.pendingJobId = null;
    c.confirming = false;
    c.expanded = {};

    var activeJob = null;
    var pollTimer = null;
    var agentTimer = null;
    var pollFailures = 0;
    var agentFailures = 0;

    function call(action, params) {
        params = params || {};
        params.action = action;
        return c.server.get(params).then(function (r) {
            return (r && r.data) || {};
        });
    }

    // ---- rendering helpers ------------------------------------------------

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function anchor(href, label) {
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    }

    c.linkifyHtml = function (text) {
        var safe = escapeHtml(text === null || text === undefined ? '' : text);
        return safe.replace(LINK_RE, function (all, label, href, bare, prefix, digits) {
            if (href) return anchor(href, label);
            if (bare) {
                var trail = /[.,;:!?)\]]+$/.exec(bare);
                var t = trail ? trail[0] : '';
                if (t) bare = bare.slice(0, -t.length);
                return anchor(bare, bare) + t;
            }
            var table = TASK_TABLES[prefix];
            if (!table) return all;
            var num = prefix + digits;
            return anchor('/' + table + '_list.do?sysparm_query=number%3D' + num, num);
        });
    };

    c.linkify = function (text) {
        return $sce.trustAsHtml(c.linkifyHtml(text));
    };

    c.pretty = function (obj) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return String(obj);
        }
    };

    function decorate(m) {
        if (m.role === 'tool') {
            m.ok = !!(m.parsed && m.parsed.ok);
            m.body = c.pretty(m.parsed !== null && m.parsed !== undefined ? m.parsed : m.content);
        } else {
            m.hidden = m.role === 'assistant' && !m.content && m.tool_calls && m.tool_calls.length > 0;
            m.html = c.linkify(m.content);
        }
        return m;
    }

    function decorateAll(list) {
        var out = [];
        for (var i = 0; i < (list || []).length; i++) out.push(decorate(list[i]));
        return out;
    }

    c.argList = function (args) {
        var out = [];
        for (var k in args || {}) {
            if (!args.hasOwnProperty(k)) continue;
            var v = args[k];
            out.push({ key: k, value: typeof v === 'object' && v !== null ? c.pretty(v) : String(v) });
        }
        return out;
    };

    c.busyText = function () {
        return c.status === 'tool_call' && c.lastTool ? 'Calling ' + c.lastTool + '…' : 'Thinking…';
    };

    c.agentStatusText = function () {
        var s = c.agentStatus;
        if (!s) return '';
        if (s.closed) return 'Agent ended the chat — back to AI assistant.';
        if (s.accepted) return 'Connected with ' + (s.agent_name || 'an agent');
        var age = s.age_seconds || 0;
        if (age < 30) return 'Waiting for an agent to pick up…';
        if (age <= 120) return 'Still waiting — agents may be busy (' + age + 's)';
        return 'No agent has picked up in ' + age + 's. They may be offline or all in other chats.';
    };

    c.toggleTool = function (m) {
        c.expanded[m.sys_id] = !c.expanded[m.sys_id];
    };

    c.inputRows = function () {
        return Math.min(8, Math.max(1, (c.input || '').split('\n').length));
    };

    function scrollToBottom() {
        $timeout(function () {
            var el = $window.document.getElementById('wf-messages');
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    }

    // ---- conversation state -------------------------------------------------

    function applyConversation(d) {
        c.conversationId = d.conversation_id || c.conversationId;
        c.messages = decorateAll(d.messages);
        c.mode = d.mode || 'ai';
        if (c.mode === 'agent') {
            c.agentStatus = d.agent_status || { queued: true, age_seconds: 0 };
            startAgentPolling();
        }
        if (d.pending_job && !c.pendingJobId && !activeJob) {
            c.pending = d.pending_job.pending;
            c.pendingJobId = d.pending_job.job_sys_id;
            c.busy = true;
        }
        scrollToBottom();
    }

    function finishJob() {
        activeJob = null;
        c.busy = false;
        c.status = '';
        c.lastTool = '';
        if (pollTimer) $timeout.cancel(pollTimer);
        pollTimer = null;
    }

    function schedulePoll(jobId, delay) {
        if (pollTimer) $timeout.cancel(pollTimer);
        pollTimer = $timeout(function () {
            pollTimer = null;
            if (activeJob !== jobId) return;
            call('poll', { job_sys_id: jobId }).then(
                function (d) {
                    if (activeJob !== jobId) return;
                    pollFailures = 0;
                    if (!d.ok) {
                        finishJob();
                        c.error = d.error || 'The reply could not be loaded.';
                        return;
                    }
                    c.status = d.status;
                    c.lastTool = d.last_tool;
                    if (d.status === 'complete' || d.status === 'error') {
                        applyConversation(d);
                        if (d.conversations) c.conversations = d.conversations;
                        finishJob();
                        if (d.status === 'error') {
                            c.messages.push(decorate({ sys_id: 'local-err-' + Date.now(), role: 'assistant', content: '[error: ' + (d.error || 'unknown error') + ']', isError: true }));
                            scrollToBottom();
                        }
                        return;
                    }
                    if (d.status === 'awaiting_confirmation') {
                        applyConversation(d);
                        c.pending = d.pending || [];
                        c.pendingJobId = jobId;
                        return; // polling resumes after Approve / Cancel
                    }
                    schedulePoll(jobId, POLL_MS);
                },
                function () {
                    if (activeJob !== jobId) return;
                    pollFailures++;
                    if (pollFailures >= MAX_FAILURES) {
                        finishJob();
                        c.error = 'Lost contact with the server while waiting for the reply. Reload the page to see the latest messages.';
                        return;
                    }
                    schedulePoll(jobId, POLL_RETRY_MS);
                }
            );
        }, delay);
    }

    function startAgentPolling() {
        if (agentTimer) return;
        agentFailures = 0;
        scheduleAgentPoll(AGENT_POLL_MS);
    }

    function stopAgentPolling() {
        if (agentTimer) $timeout.cancel(agentTimer);
        agentTimer = null;
    }

    function scheduleAgentPoll(delay) {
        agentTimer = $timeout(function () {
            var convId = c.conversationId;
            if (!convId) {
                agentTimer = null;
                return;
            }
            call('agent_poll', { conversation_id: convId }).then(
                function (d) {
                    if (convId !== c.conversationId || !agentTimer) return;
                    agentFailures = 0;
                    if (!d.ok) {
                        agentTimer = null;
                        c.error = d.error || 'Could not refresh the agent chat.';
                        return;
                    }
                    var before = c.messages.length;
                    c.messages = decorateAll(d.messages);
                    if (c.messages.length !== before) scrollToBottom();
                    if (d.mode !== 'agent') {
                        agentTimer = null;
                        c.mode = 'ai';
                        c.agentStatus = c.agentStatus ? { closed: true } : null;
                        return;
                    }
                    c.mode = 'agent';
                    c.agentStatus = d.agent_status;
                    scheduleAgentPoll(AGENT_POLL_MS);
                },
                function () {
                    if (!agentTimer) return;
                    agentFailures++;
                    if (agentFailures >= MAX_FAILURES) {
                        agentTimer = null;
                        c.error = 'Lost contact with the server. Reload the page to see new agent messages.';
                        return;
                    }
                    scheduleAgentPoll(AGENT_RETRY_MS);
                }
            );
        }, delay);
    }

    // ---- actions ------------------------------------------------------------

    c.send = function () {
        var text = (c.input || '').trim();
        if (!text || c.busy) return;
        c.error = '';
        c.input = '';
        c.busy = true;
        c.status = 'running';
        c.lastTool = '';
        c.messages.push(decorate({ sys_id: 'local-' + Date.now(), role: 'user', content: text }));
        scrollToBottom();
        call('send', { message: text, conversation_id: c.conversationId }).then(
            function (d) {
                if (!d.ok) {
                    finishJob();
                    c.error = d.error || 'The message could not be sent.';
                    return;
                }
                c.conversationId = d.conversation_id;
                if (d.mode === 'agent') {
                    finishJob();
                    c.mode = 'agent';
                    if (d.agent_send_ok === false) c.error = 'Your message was saved but could not be delivered to the agent: ' + (d.agent_send_error || 'unknown error');
                    startAgentPolling();
                    return;
                }
                if (!d.job_sys_id) {
                    finishJob();
                    c.error = 'No reply was started. Check the System Log for "Wayfinder".';
                    return;
                }
                activeJob = d.job_sys_id;
                pollFailures = 0;
                schedulePoll(d.job_sys_id, POLL_MS);
            },
            function () {
                finishJob();
                c.error = 'Could not reach the server. Check your connection and try again.';
            }
        );
    };

    c.onKeydown = function (e) {
        if (e.keyCode === 13 && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            c.send();
        }
    };

    c.confirm = function (approved) {
        var jobId = c.pendingJobId;
        if (!jobId || c.confirming) return;
        c.confirming = true;
        call('confirm', { job_sys_id: jobId, approved: approved }).then(
            function (d) {
                c.confirming = false;
                if (!d.ok) {
                    c.error = d.error || 'Could not record your answer.';
                    return;
                }
                c.pending = null;
                c.pendingJobId = null;
                c.status = 'running';
                activeJob = jobId;
                schedulePoll(jobId, POLL_MS);
            },
            function () {
                c.confirming = false;
                c.error = 'Could not reach the server. Try again.';
            }
        );
    };

    c.newChat = function () {
        stopAgentPolling();
        finishJob();
        c.conversationId = null;
        c.messages = [];
        c.mode = 'ai';
        c.agentStatus = null;
        c.pending = null;
        c.pendingJobId = null;
        c.error = '';
        c.expanded = {};
    };

    c.openConversation = function (id) {
        if (id === c.conversationId) return;
        c.newChat();
        c.conversationId = id;
        call('load_conversation', { conversation_id: id }).then(
            function (d) {
                if (c.conversationId !== id) return;
                if (!d.ok) {
                    c.error = d.error || 'Could not open that conversation.';
                    return;
                }
                applyConversation(d);
            },
            function () {
                c.error = 'Could not reach the server. Try again.';
            }
        );
    };

    c.deleteConversation = function (id, $event) {
        if ($event) $event.stopPropagation();
        if (!$window.confirm('Delete this conversation? This cannot be undone.')) return;
        call('delete_conversation', { conversation_id: id }).then(
            function (d) {
                if (!d.ok) {
                    c.error = d.error || 'Could not delete the conversation.';
                    return;
                }
                c.conversations = d.conversations || [];
                if (id === c.conversationId) c.newChat();
            },
            function () {
                c.error = 'Could not reach the server. Try again.';
            }
        );
    };

    c.cancelAgentChat = function () {
        if (!c.conversationId) return;
        if (!$window.confirm('Leave the agent queue and go back to the AI assistant?')) return;
        stopAgentPolling();
        call('cancel_agent_chat', { conversation_id: c.conversationId }).then(
            function (d) {
                if (!d.ok) {
                    c.error = d.error || 'Could not leave the queue.';
                    return;
                }
                c.agentStatus = null;
                applyConversation(d);
            },
            function () {
                c.error = 'Could not reach the server. Try again.';
            }
        );
    };

    c.refreshConversations = function () {
        call('list_conversations').then(function (d) {
            if (d.ok) c.conversations = d.conversations || [];
        });
    };

    $scope.$on('$destroy', function () {
        stopAgentPolling();
        finishJob();
    });
};
