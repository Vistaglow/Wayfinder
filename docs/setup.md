# Setup

## Before you start

- A ServiceNow instance where you are an admin. A Personal Developer Instance works; everything here uses standard platform features, not Now Assist.
- Node.js 20 or later.
- An Azure OpenAI / AI Foundry chat **deployment** that supports tool calling, and a smoke test that passes against it. See [azure-foundry.md](azure-foundry.md); do this first, because errors are much easier to read there than in the chat.

## 1. Install the app

```bash
npm ci
npm test                         # offline unit tests, no instance needed
npx now-sdk auth --add           # once: instance URL and login, stored in your OS credential store
npm run build
npm run deploy                   # now-sdk install: installs or updates x_snc_wayfinder_ai
```

To hand the app to someone without the SDK, `npm run pack` builds an installable zip.

What gets installed: 4 tables with ACLs, 5 script includes, 2 async business rules, the `Wayfinder Chat` scripted REST API, 2 widgets, 2 portal pages, the **Wayfinder AI** application menu, cross-scope privileges, an ATF test, and, **on first install only**, the system properties and 8 starter tools. Because properties and tools are first-install records, later updates never overwrite values or tool edits you made on the instance.

## 2. Set the properties

Open **Wayfinder AI > Configuration > Properties** (admin) and set the values that passed the smoke test:

| Property | Value |
|---|---|
| `x_snc_wayfinder_ai.azure_endpoint` | The resource host only: `https://<your-resource>.openai.azure.com`. If the portal shows a URL ending in `/openai/v1`, drop everything from `/openai` on. No trailing slash. |
| `x_snc_wayfinder_ai.azure_deployment` | The **deployment name** from the Deployments list (the Name column), not the model name. |
| `x_snc_wayfinder_ai.azure_api_version` | The api-version that worked in the smoke test, e.g. `2025-04-01-preview`. The installed default (`2024-08-01-preview`) is too old for newer models. |
| `x_snc_wayfinder_ai.azure_api_key` | The key (encrypted property). |

Temperature: Wayfinder sends no `temperature` unless `x_snc_wayfinder_ai.azure_temperature` holds a number. Leave it unset for reasoning models (gpt-5 family, o-series), which reject anything but their default. That property only exists on instances where the app was first installed after it was added; elsewhere, create it by hand (type string) if you need it.

The rest have working defaults. The full list is in [tables.md](tables.md#system-properties).

## 3. Give people access

- **Chat:** every signed-in user can use `/sp?id=wayfinder`. They only ever see their own conversations.
- **Tool builder:** grant `x_snc_wayfinder_ai.admin` to the people who should build and test tools. Platform admins already pass.

## 4. Try it

Open `/sp?id=wayfinder` (or `/esc?id=wayfinder`) and ask "how do I reset my password". You should see a `search_knowledge` tool card and an answer that cites a KB article with a link.

Then run the ATF test **Wayfinder - tools respect ACLs and block query injection** (Automated Test Framework > Tests) on a sub-production instance.

## 5. Optional: live-agent handoff

1. Activate Virtual Agent, Conversational Integration and Agent Chat if they are not active.
2. Enable Basic Auth on the OOB **VA Bot Integration** scripted REST API and create a dedicated integration user for it.
3. Run [scripts/seed-va-provider.snscript.js](../scripts/seed-va-provider.snscript.js) in **Scripts - Background** (global scope). It creates or updates the **Wayfinder External Bot** provider and channel identity (inbound id `wayfinder_bot`, outbound URL `/api/x_snc_wayfinder_ai/wayfinder/va_inbound`) and a `token_verification` row, and prints the sys_ids and token.
4. Replace the `CHANGE_ME` outbound password, and make the provider send `X-Wayfinder-Secret: <secret>`.
5. Set `bot_api_basic_user`, `bot_api_basic_password`, `bot_api_token`, `va_inbound_secret`, and `bot_api_live_agent_topic_sys_id` (the sys_id of the **Live Agent Support** topic in `sys_cs_topic`; its name often has a trailing period).
6. Check that the topic's transfer node points at the Wayfinder provider, then set `use_bot_api` to `true`.

Test: ask "talk to a human", approve the card, and watch the queued banner. Accept the chat in Agent Workspace and reply: the reply appears as an orange bubble with the agent's name. **Return to AI** ends the VA session.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `[error: Azure returned HTTP 401 …]` | Wrong or empty API key, or a key from a different resource than the endpoint. |
| `HTTP 404` with `DeploymentNotFound` | The endpoint reached a resource, but it has no deployment with that name. Check that the endpoint is the right resource (Foundry often names it `<project>-resource`), and that `azure_deployment` is the deployment name, not the model name. A deployment created in the last few minutes may not answer yet. |
| `HTTP 404` (other) | Wrong endpoint. Wayfinder calls `{endpoint}/openai/deployments/{deployment}/chat/completions?api-version=…`, so the endpoint must be the host only. |
| `HTTP 400` "`temperature` does not support 0.7 … Only the default (1) value is supported" | A reasoning model with a temperature set. Clear `x_snc_wayfinder_ai.azure_temperature`. (Builds before this property existed always sent 0.7: redeploy with `npm run deploy`.) |
| `HTTP 400` about the api-version or an unsupported parameter | The api-version is too old for the model. Set `azure_api_version` to the one that passed the smoke test. |
| `HTTP 429` | Quota or rate limit on the deployment. Raise the TPM limit in Azure. |
| Status stays on "Thinking…" | The async rule is not running. Check **System Log > All** for messages containing `Wayfinder`, and that the business rule **Wayfinder - run chat job** is active. Async rules can queue for a while on busy instances. |
| "The chat job is not running as the conversation owner" | The async rule ran as a different user, so the agent refused to run tools. Check for customizations that insert chat jobs as another user. |
| The model never calls tools | The deployment does not support tool calling, or no tools are enabled. Run the tool-calling smoke test in [azure-foundry.md](azure-foundry.md). |
| `search_knowledge` returns nothing | Usually knowledge user criteria. Impersonate the user and search the KB yourself. |
| A widget looks unstyled | Open the widget in Service Portal > Widgets and save it once to recompile the SCSS, then hard-refresh (Ctrl+Shift+R). |
| Your edits to a widget or script disappeared | `npm run deploy` overwrites app files with the repo version. Edit in the repo, not on the instance. (Properties and starter tools are not overwritten.) |
