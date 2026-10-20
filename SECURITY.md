# Security

## Reporting a vulnerability

Please report security problems privately to the maintainers (GitHub private vulnerability reporting, once the repository is published). Do not open a public issue.

## Never commit secrets

API keys, passwords, tokens and instance URLs never go in this repository. They live in encrypted (`password2`) system properties on the instance, and SDK logins live in the OS credential store (`now-sdk auth`). `.gitignore` excludes `*.local.json`, `.env*` and `secrets.*`.

## Security design

| Control | How |
|---|---|
| The AI sees only what the user can see | Chat jobs run in an async business rule as the user who sent the message. If the job is somehow running as anyone else, the agent stops (fails closed). Tools query with `GlideRecordSecure` and also skip any row where `canRead()` is false, and any field where the field-level `canRead()` is false. |
| Write tools only touch declared fields | Update and create tools set only parameters the admin declared; undeclared keys are dropped and logged; field-level `canWrite()` is checked. |
| Humans approve writes | Tools marked "Ask for approval before running" never run until the user clicks Approve. The pending calls are stored on the job and resumed by a separate rule. The starter write tools (`update_task`, `submit_catalog_request`, `escalate_to_agent`) ship with approval on. |
| No encoded-query injection | `^`, line breaks and `javascript:` are stripped from model-supplied values. Raw-query parameters (opt-in per parameter) may contain `^` but may not start with `OR`, may not contain `^NQ`, and may only call an allowlist of date helpers through `javascript:`. Invalid queries are refused instead of silently ignored. |
| Ownership on every action | Every chat widget action (send, poll, confirm, load, delete, cancel) checks that the conversation belongs to the signed-in user. Record ACLs enforce the same rule for list, form and API access. |
| Admin-only configuration | Tool create, update, delete and test require `x_snc_wayfinder_ai.admin`, checked on the server. Properties are readable and writable by admins only. |
| Webhook authentication | `POST /api/x_snc_wayfinder_ai/wayfinder/va_inbound` requires an authenticated caller and the `X-Wayfinder-Secret` header (constant-time compare). With no secret configured, every call is rejected. |
| Safe rendering | Chat text is HTML-escaped before links are added, in one regex pass; only `http(s)://` and same-origin `/` links are rendered, with `rel="noopener noreferrer"`. |
| Bounded tool results | Results over 16,000 characters are trimmed into a valid JSON envelope (`truncated: true`). |
| Provider errors are scrubbed | The API key and long token-like strings are removed from error text before it is logged or stored. |
| Optional integrations are off by default | Live-agent handoff (`x_snc_wayfinder_ai.use_bot_api`) ships off. |

The ATF test **"Wayfinder - tools respect ACLs and block query injection"** checks the first four rows on a live instance.
