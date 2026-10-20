# Data dictionary

All tables are in the `x_snc_wayfinder_ai` scope. Choice fields are dropdowns without a "none" option.

## x_snc_wayfinder_ai_conversation: one row per chat thread

| Field | Type | Notes |
|---|---|---|
| `user` | reference → sys_user, mandatory | Owner. |
| `title` | string 255, default `New chat` | Replaced by the first 60 characters of the first message. |
| `mode` | choice `ai` / `agent`, default `ai` | `agent`: messages go to a live agent. |
| `interaction` | reference → interaction | Optional, unused (kept for compatibility). |
| `agent_conversation` | string 32 | Optional, unused. |

## x_snc_wayfinder_ai_message: one row per message

| Field | Type | Notes |
|---|---|---|
| `conversation` | reference, mandatory, cascade delete | |
| `role` | choice `user` / `assistant` / `tool`, mandatory | |
| `content` | string 65535 | Text, or JSON for tool results. |
| `tool_name` | string 100 | Tool name on tool rows. |
| `tool_call_id` | string 100 | On tool rows; matches an id in the parent assistant row's `tool_calls`. |
| `tool_calls` | string 65535 | JSON array of OpenAI-shape tool calls on assistant rows. |
| `source` | string 40 | `agent` for live-agent messages; empty for AI. |
| `agent_name` | string 100 | The human agent's display name. |
| `seq` | string 20 | Millisecond ordering key (sys_created_on has 1-second precision). |

Indexes: (`conversation`, `seq`) and (`conversation`, `sys_created_on`).

## x_snc_wayfinder_ai_chat_job: one row per AI turn

| Field | Type | Notes |
|---|---|---|
| `conversation` | reference, mandatory, cascade delete | |
| `user_message` | string 65535 | The text that started the turn. |
| `status` | choice: `new`, `running`, `tool_call`, `streaming` (reserved), `awaiting_confirmation`, `confirmed`, `cancelled`, `complete`, `error` | Polled by the widget. |
| `content` | string 65535 | Final reply. |
| `last_tool` | string 100 | Drives the "Calling X…" indicator. |
| `error_message` | string 1024 | |
| `pending_tool_calls` | string 65535 | JSON `[{tool_call_id, name, args}]` for the confirmation gate. |

## x_snc_wayfinder_ai_tool: the tool catalog

| Field | Type | Notes |
|---|---|---|
| `name` | string 80, mandatory, unique | snake_case function name sent to the model. |
| `description` | string 4000 | Routing instructions the model reads. |
| `enabled` | boolean, default true | |
| `kind` | choice `table` / `builtin` | |
| `operation` | choice `read` / `update` / `create` | Table tools. |
| `parameters_json` | string 8000, default `[]` | `[{name, type, description, required, raw_query?}]` |
| `target_table` | string 80 | Table tools. |
| `encoded_query_template` | string 4000 | Read tools; see [tools.md](tools.md#placeholders). |
| `return_fields` | string 2000 | Comma-separated fields returned to the model. |
| `max_results` | integer, default 10 | Read tools; the model may ask for up to twice this. |
| `require_confirmation` | boolean, default false | Enforced by the agent loop. |

## ACLs

| Table | read | write / create / delete |
|---|---|---|
| conversation | owner (`user` = me) | owner |
| message, chat job | owner of the parent conversation | owner of the parent conversation |
| tool | any signed-in user (the agent lists tools as the caller) | `x_snc_wayfinder_ai.admin` |

Platform admins pass every ACL (`admin_overrides`). Server scripts also check ownership explicitly on every widget action.

## System properties

Installed on first install only, so updates never reset them. Read and write: admins.

| Property | Type | Default / purpose |
|---|---|---|
| `x_snc_wayfinder_ai.azure_endpoint` | string | `https://YOUR-RESOURCE.openai.azure.com` |
| `x_snc_wayfinder_ai.azure_deployment` | string | `gpt-4o-mini` (placeholder: set your own deployment name; this model is deprecated) |
| `x_snc_wayfinder_ai.azure_api_version` | string | `2024-08-01-preview` (newer models need a newer version, e.g. `2025-04-01-preview`) |
| `x_snc_wayfinder_ai.azure_api_key` | password2 | empty; required |
| `x_snc_wayfinder_ai.azure_timeout_ms` | integer | `120000` |
| `x_snc_wayfinder_ai.azure_temperature` | string | empty: temperature is not sent. Set e.g. `0.7` only for models that accept it (not gpt-5 family or o-series). Added after 1.0.0's first install: on an instance that already has the app, create it by hand if you want it. |
| `x_snc_wayfinder_ai.system_prompt` | string | See `src/fluent/system-prompt.txt`. |
| `x_snc_wayfinder_ai.use_bot_api` | boolean | `false`: live-agent handoff off |
| `x_snc_wayfinder_ai.bot_api_basic_user` | string | Basic Auth user for the VA Bot API |
| `x_snc_wayfinder_ai.bot_api_basic_password` | password2 | |
| `x_snc_wayfinder_ai.bot_api_token` | password2 | Token from the `token_verification` row |
| `x_snc_wayfinder_ai.bot_api_live_agent_topic_sys_id` | string | sys_id of the Live Agent Support topic |
| `x_snc_wayfinder_ai.bot_api_timeout_ms` | integer | `30000` |
| `x_snc_wayfinder_ai.va_inbound_secret` | password2 | Required `X-Wayfinder-Secret` header value; empty rejects all callbacks |
| `x_snc_wayfinder_ai.portal_suffix` | string | `esc`: portal used in generated links (`sp` also works) |
