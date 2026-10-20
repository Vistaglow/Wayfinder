# Architecture

```
Service Portal page ?id=wayfinder
 └─ Widget "wayfinder-chat"  (template / SCSS / AngularJS client / server script running as the user)
      │  c.server.get({action: 'send' | 'poll' | 'confirm' | ...})
      ▼
 Widget server script
      │  AI mode:    insert x_snc_wayfinder_ai_chat_job (status=new) and return at once
      │  Agent mode: save the message and pass it to the VA Bot Integration API
      ▼
 Async business rule "Wayfinder - run chat job" (insert)
      │  new x_snc_wayfinder_ai.WayfinderAgent().runJob(sys_id)   (runs as the sender)
      ▼
 WayfinderAgent ──▶ WayfinderAzureClient.complete(messages, tools) ──▶ Azure chat/completions
      │  loop up to 4 times while the model returns tool_calls
      ▼
 WayfinderTools.execute(name, args, context) → GlideRecordSecure against ServiceNow tables
      │  every message saved to x_snc_wayfinder_ai_message
      ▼
 Job row: running → tool_call (last_tool) → complete | error | awaiting_confirmation
      ▲
 The widget polls the job every 750 ms and, when it finishes, re-renders the saved history.
```

Live agent:

```
escalate_to_agent → WayfinderBotApiClient → /api/sn_va_as_service/bot/integration
VA outbound webhook → POST /api/x_snc_wayfinder_ai/wayfinder/va_inbound → message rows (source=agent)
```

## Why a job table

Widget and scripted-REST transactions time out at about 30 seconds, but an agent loop with several model round-trips takes 30–90 seconds. Inserting a job row returns in milliseconds. The async rule runs after commit on its own thread with no transaction time limit, and polling one record is cheap. Scripted REST can't stream, so this "block and poll" design replaces streaming.

## The agent loop (`WayfinderAgent`)

1. Load the job and conversation. Read properties first.
2. Check identity: the async rule normally runs as the user who inserted the job. If it doesn't, the agent tries `GlideImpersonate` (only available in global scope) and otherwise **stops**, rather than running tools as someone else.
3. Save the user message; the first message becomes the conversation title (60 characters).
4. Rebuild history. `sys_created_on` has 1-second precision, so messages also carry a millisecond `seq` key. History is rebuilt without trusting order for tool rows: each assistant row with `tool_calls` is followed by exactly its tool rows (found by `tool_call_id`), and a missing result is synthesized as `{"ok":false,"error":"tool result missing in history"}`, because the model API rejects a tool message that doesn't directly follow its parent.
5. Call the model with the enabled tools. If it answers with text, that's the reply. If it asks for tools, save the assistant row and run each call (`status=tool_call`, `last_tool=<name>`), saving each result as a tool row. Results over 16,000 characters are trimmed into a valid JSON envelope.
6. Up to 4 model calls per turn; after that the reply is `[stopped: exceeded tool-call iteration limit]`.
7. Before each write, re-check that the job and conversation still exist (the user may delete the chat mid-run).

## The confirmation gate

If the model asks for a tool marked **Ask for approval before running**, that call does not run. Calls that don't need approval in the same batch run normally. The pending calls are stored in `pending_tool_calls` and the job moves to `awaiting_confirmation`. The widget shows an Approve / Cancel card. The `confirm` action (ownership-checked) sets the job to `confirmed` or `cancelled`, and the async update rule **Wayfinder - resume after confirmation** either runs the calls or records `{"ok":false,"error":"User declined this action."}`, then continues the loop so the model can respond.

## Live-agent handoff

`escalate_to_agent` makes two Bot Integration API calls with the conversation sys_id as `clientSessionId` (pairing chat threads with VA sessions without an extra table) and the user's `user_name` as `userId` (a sys_id puts VA into guest mode, and guests can't be transferred):

1. `START_CONVERSATION` with text `hi`.
2. The Live Agent Support topic sys_id as text with `typed: false`, which jumps straight into that topic. (Putting the topic in the start call falls through to the greeting topic.)

The conversation switches to `mode=agent`. From then on the widget sends user messages to VA and polls every 2 seconds. VA posts agent messages to the `va_inbound` webhook; when VA sends `completed` or `takeControl`, the conversation returns to AI mode.

## Scope notes

The original design targeted global scope (`u_` tables, `GlideImpersonate`). This build is a scoped Fluent app, so:

- tables are `x_snc_wayfinder_ai_*` and script includes are called as `x_snc_wayfinder_ai.<Name>`;
- impersonation isn't available, which is why the agent relies on the async rule's user and fails closed;
- the REST path is `/api/x_snc_wayfinder_ai/wayfinder/va_inbound` (only global apps can use `/api/now/…`);
- the update-set generator is replaced by `now-sdk build` / `install` / `pack`, which give deterministic record IDs through `src/fluent/generated/keys.ts`.
