# Known issues and differences from the original design

## Not yet verified on an instance

This build compiles (`now-sdk build`) and passes the offline unit tests, but it has not been installed on an instance yet. Check these first on a PDI:

- **Async rule identity.** The design relies on async business rules running as the user who inserted the job. If a job fails with "not running as the conversation owner", that assumption doesn't hold on your release; tell us the release and see [architecture.md](architecture.md#the-agent-loop-wayfinderagent).
- **Module links.** The Chat and Tool builder modules use `link_type=DIRECT` with the URL in `query`. If they open the wrong page, change them to "URL (from Arguments)".
- **SCSS compile.** The widgets use CSS custom properties and nesting. If a widget appears unstyled, open and save it once.
- **VA provider columns.** `scripts/seed-va-provider.snscript.js` guesses column names across releases and prints which ones it set. Check the provider record afterwards.
- **Custom header from VA.** The webhook requires `X-Wayfinder-Secret`. If your provider configuration can't send custom headers, the webhook will reject every callback; there is no fallback yet.

## Deliberate differences from the original spec

| Spec | This build | Why |
|---|---|---|
| Global scope, `u_` tables, `/api/now/wayfinder/…` | Scoped app `x_snc_wayfinder_ai`, `/api/x_snc_wayfinder_ai/wayfinder/va_inbound` | Built with Fluent as a scoped app. |
| `GlideImpersonate` in the agent | Runs as the async rule's user and fails closed if that isn't the owner; uses `GlideImpersonate` only if available | Impersonation isn't available to scoped apps. |
| Python update-set generator, Makefile | `now-sdk build` / `install` / `pack` | Fluent already produces deterministic, re-importable records. |
| Seed script for tools; properties installed manually | First-install records (`$meta.installMethod: 'first install'`) | Same goal (re-installs never overwrite admin values) with no manual step. |
| Message columns `u_name`, job `u_error`, tool `u_fields`, `u_limit` | `tool_name`, `error_message`, `return_fields`, `max_results` | Avoid names that clash with reserved words or are ambiguous. |
| Ordering by `sys_created_on` only | Extra millisecond `seq` column | Two rows in the same second could swap. |
| Catalog variable type table in the spec | Mapped from the platform's actual `item_option_new.type` codes; masked (password) and attachment variables dropped | Several codes in the spec table didn't match the platform. |
| `use_bot_api` default `true`; `bot_api_token` plain string | Default `false`; token is `password2` | Optional integrations off by default; tokens are secrets. |
| Tool builder page open to all | Same, but write and test actions need `x_snc_wayfinder_ai.admin` (platform admin also passes) | Least privilege with a dedicated app role. |

## Behavior worth knowing

- Approving a confirmation card runs only the calls that needed approval; other calls in the same model response already ran.
- `escalate_to_agent` doesn't forward its `summary` to the agent yet; the agent sees the VA transcript.
- Agent-mode status `age_seconds` counts from the first message of the conversation, not from the handoff.
