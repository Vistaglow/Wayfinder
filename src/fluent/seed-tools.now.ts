import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

// Starter tools, installed on FIRST INSTALL only so admin edits in the tool
// builder survive app updates. Descriptions are routing instructions for the
// model, not human docs. To restore one later, recreate it in the tool builder.

Record({
    $id: Now.ID['tool_search_knowledge'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'search_knowledge',
        kind: 'builtin',
        operation: 'read',
        enabled: true,
        require_confirmation: false,
        max_results: 3,
        description:
            "Search the company knowledge base for how-to, troubleshooting and policy answers (password resets, VPN, expenses, leave policy...). Results are filtered to articles the user can read. Pass 2–6 keywords, not a full sentence. Answer from the excerpts, cite the article number (KB...) and include the article link as a markdown link. If nothing relevant comes back, say so instead of guessing.",
        parameters_json: JSON.stringify([
            { name: 'query', type: 'string', description: 'Keywords to search for, e.g. "reset password" or "vpn mac".', required: true },
            { name: 'limit', type: 'integer', description: 'How many articles to return (1-5, default 3).', required: false },
        ]),
    },
})

Record({
    $id: Now.ID['tool_search_catalog'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'search_catalog',
        kind: 'builtin',
        operation: 'read',
        enabled: true,
        require_confirmation: false,
        max_results: 5,
        description:
            "Find service catalog items. Try this FIRST whenever the user wants to GET, CHANGE, ADD, REMOVE or REQUEST anything: \"I need a new laptop\" -> query \"laptop\"; \"can I get Visio\" -> \"visio\"; \"I need access to the finance share\" -> \"access\"; \"new starter next week\" -> \"onboarding\"; \"my phone is broken\" -> \"mobile\". Use 1-4 keywords; an empty query browses the catalog. Present matches as markdown links, then offer two paths: (A) walk through the request here in chat (use get_catalog_item), or (B) open the form link. Default to (A) for short forms and (B) when the item has more than 10 variables. If there are 0 results, say so honestly and offer to raise an incident or point to IT contacts.",
        parameters_json: JSON.stringify([
            { name: 'query', type: 'string', description: '1-4 keywords. Leave empty to browse.', required: false },
            { name: 'limit', type: 'integer', description: 'How many items to return (1-10, default 5).', required: false },
        ]),
    },
})

Record({
    $id: Now.ID['tool_get_catalog_item'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'get_catalog_item',
        kind: 'builtin',
        operation: 'read',
        enabled: true,
        require_confirmation: false,
        max_results: 1,
        description:
            "Get a catalog item's form: its description and ordered variables (questions). Use after search_catalog when the user chooses to request in chat. Then: ask the variables ONE AT A TIME, in order, using each variable's question text; present choice variables as a numbered list of labels; resolve reference values (a person's name or email) with a lookup tool before using them; always collect required variables, optional ones may be skipped if the user wants. When all are collected, summarize the answers and get explicit confirmation. Only then call submit_catalog_request.",
        parameters_json: JSON.stringify([
            { name: 'sys_id', type: 'string', description: 'The 32-character sys_id of the catalog item (from search_catalog).', required: true },
        ]),
    },
})

Record({
    $id: Now.ID['tool_submit_catalog_request'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'submit_catalog_request',
        kind: 'builtin',
        operation: 'create',
        enabled: true,
        require_confirmation: true,
        max_results: 1,
        description:
            "Order a catalog item for the user. Only call after get_catalog_item, after collecting the variables and after the user confirmed the summary. Variables: choice variables take the choice VALUE (not the label), reference variables take a 32-character sys_id, booleans take 'true' or 'false'. The user is asked to approve before it runs. In your reply include the REQ number, the RITM number and the request URL as a markdown link.",
        parameters_json: JSON.stringify([
            { name: 'catalog_item_sys_id', type: 'string', description: 'sys_id of the catalog item.', required: true },
            { name: 'variables', type: 'object', description: 'Object of variable name to value, e.g. {"laptop_model":"mbp14","justification":"old one broke"}.', required: false },
            { name: 'quantity', type: 'integer', description: 'Quantity, default 1.', required: false },
        ]),
    },
})

Record({
    $id: Now.ID['tool_escalate_to_agent'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'escalate_to_agent',
        kind: 'builtin',
        operation: 'create',
        enabled: true,
        require_confirmation: true,
        max_results: 1,
        description:
            "Hand the chat to a human live agent. Use when the user asks for a person, when your tools could not resolve the issue (offer it first), or when the matter is sensitive or the user is upset. Before calling, tell the user and summarize what will be sent, then wait for their confirmation. After it succeeds, say they are in the QUEUE and NOT yet connected — never say \"connected\" or \"transferred\". Mention that the status banner will update when an agent picks up and that they can keep typing. Do not give a URL.",
        parameters_json: JSON.stringify([
            { name: 'topic', type: 'string', description: 'Short topic, e.g. "VPN access issue".', required: true },
            { name: 'summary', type: 'string', description: 'Two or three sentences the agent should know: problem, what was tried, any ticket numbers.', required: true },
            { name: 'team', type: 'string', description: 'Team to route to, if known (e.g. "Service Desk").', required: false },
        ]),
    },
})

Record({
    $id: Now.ID['tool_get_task'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'get_task',
        kind: 'builtin',
        operation: 'read',
        enabled: true,
        require_confirmation: false,
        max_results: 1,
        description:
            "Get one ticket by number, across all task types (incident, change, problem, request, requested item, catalog task...). Pass the number with its prefix (INC0010001, CHG0030002, RITM0010003). Returns the type, state, priority, assignee and a choices map (value and label for state, priority, urgency, impact, close_code). Always call this before update_task. Use search_tasks instead when the user wants a list.",
        parameters_json: JSON.stringify([
            { name: 'number', type: 'string', description: 'Ticket number including its prefix, e.g. INC0010001.', required: true },
        ]),
    },
})

Record({
    $id: Now.ID['tool_search_tasks'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'search_tasks',
        kind: 'table',
        operation: 'read',
        enabled: true,
        require_confirmation: false,
        target_table: 'task',
        encoded_query_template: '{query}',
        return_fields: 'sys_id,number,sys_class_name,short_description,state,priority,assigned_to,opened_at',
        max_results: 10,
        description:
            "List tickets (incidents, changes, problems, requests, tasks) the user can see, filtered by an encoded query. Use for questions like \"my open tickets\", \"P1 incidents\", \"changes scheduled this week\". For one ticket by number use get_task.",
        parameters_json: JSON.stringify([
            {
                name: 'query',
                type: 'string',
                raw_query: true,
                required: false,
                description:
                    'A ServiceNow encoded query (sysparm_query) on the task table. Examples: active=true | active=true^priority=1 | sys_class_name=incident^active=true | sys_class_name=change_request^state=-5 | assigned_to=javascript:gs.getUserID() | opened_by=javascript:gs.getUserID()^active=true | opened_at>=javascript:gs.daysAgoStart(7) | active=true^ORDERBYDESCpriority. Do not start with OR and do not use ^NQ.',
            },
            { name: 'limit', type: 'integer', description: 'Max rows (default 10, up to 20).', required: false },
        ]),
    },
})

Record({
    $id: Now.ID['tool_update_task'],
    $meta: { installMethod: 'first install' },
    table: 'x_snc_wayfinder_ai_tool',
    data: {
        name: 'update_task',
        kind: 'table',
        operation: 'update',
        enabled: true,
        require_confirmation: true,
        target_table: 'task',
        encoded_query_template: '',
        return_fields: 'sys_id,number,state,priority,assigned_to,short_description',
        max_results: 1,
        description:
            "Update one ticket. Mandatory flow: 1) call get_task first; 2) describe the change in human labels (\"mark INC0010001 as Resolved with close code Solved (Permanently)\") and wait for the user to confirm; 3) call this with the numeric VALUES from get_task's choices map, never the labels. The user also approves in the chat before it runs. close_code and close_notes exist only on incidents and problems. Use work_notes for internal notes and comments for notes the caller sees.",
        parameters_json: JSON.stringify([
            { name: 'sys_id', type: 'string', description: 'sys_id of the ticket (from get_task).', required: true },
            { name: 'work_notes', type: 'string', description: 'Internal work note to add.', required: false },
            { name: 'comments', type: 'string', description: 'Additional comment visible to the caller.', required: false },
            { name: 'state', type: 'string', description: 'State VALUE from get_task choices.state.', required: false },
            { name: 'short_description', type: 'string', description: 'New short description.', required: false },
            { name: 'close_code', type: 'string', description: 'Close code VALUE (incident/problem only).', required: false },
            { name: 'close_notes', type: 'string', description: 'Resolution notes (incident/problem only).', required: false },
            { name: 'assigned_to', type: 'string', description: '32-char sys_id of a sys_user.', required: false },
            { name: 'priority', type: 'string', description: 'Priority VALUE from choices.priority.', required: false },
            { name: 'urgency', type: 'string', description: 'Urgency VALUE from choices.urgency.', required: false },
            { name: 'impact', type: 'string', description: 'Impact VALUE from choices.impact.', required: false },
        ]),
    },
})
