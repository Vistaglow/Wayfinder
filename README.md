# Wayfinder AI

An AI chat assistant that runs entirely inside a ServiceNow instance, as Service Portal widgets. It talks to an OpenAI-compatible chat-completions endpoint (Azure OpenAI / AI Foundry by default) and reaches ServiceNow data through GlideRecord as the signed-in user, so ACLs, business rules, workflows and notifications apply to everything the AI reads or writes.

Built with the ServiceNow SDK (Fluent) as the scoped app `x_snc_wayfinder_ai`.

## Why in-platform

- **Cheap enough for every employee.** You pay for the tokens you use; there is no per-seat license.
- **No SSO work and no second permission model.** The user is already signed in, and every tool query runs with their own access (`GlideRecordSecure` plus a per-row `canRead()`).
- **Writes behave like the UI.** Updates and catalog orders fire business rules, flows and notifications as designed.
- **Admins extend it without code.** Tools are rows in a table, built in a point-and-click builder.

Accepted trade-offs: no token streaming (the widget polls a job record), an AngularJS 1.x client, ES5-style server scripts, and outbound REST for anything outside ServiceNow.

## What it does

| Ask | What happens |
|---|---|
| "How do I reset my password?" | `search_knowledge` finds articles the user can read; the answer cites the KB number with a link. |
| "What's the status of INC0010001?" | `get_task` looks it up across all task types; the number is auto-linked. |
| "I need a new laptop" | `search_catalog` → `get_catalog_item` → a guided question-by-question walk-through → summary → **Approve** card → a real REQ / RITM with links. |
| "Resolve INC0010001" | `get_task` → the AI confirms in plain words ("mark as Resolved") → **Approve** card → `update_task` with the right numeric state. |
| "Talk to a human" | `escalate_to_agent` hands the chat to a Virtual Agent live-agent queue; agent replies appear as orange bubbles. |

Pages: `/sp?id=wayfinder` (chat) and `/sp?id=wayfinder-tools` (tool builder). Both also work under other portals, for example `/esc?id=wayfinder`.

## Install

See [docs/setup.md](docs/setup.md). In short:

```bash
npm ci
npm test                 # offline unit tests
npx now-sdk auth --add   # once, stores credentials in your OS credential store
npm run build
npm run deploy           # installs or updates the app on the instance
```

Then set the `x_snc_wayfinder_ai.*` properties (Azure endpoint, deployment, key) and open `/sp?id=wayfinder`.

## Documentation

- [docs/setup.md](docs/setup.md): install, configure, troubleshoot
- [docs/architecture.md](docs/architecture.md): how a message flows, and why there is a job table
- [docs/azure-foundry.md](docs/azure-foundry.md): create the model deployment, smoke tests, costs
- [docs/tables.md](docs/tables.md): tables, fields, ACLs and system properties
- [docs/tools.md](docs/tools.md): table vs built-in tools, writing descriptions, placeholders
- [docs/known-issues.md](docs/known-issues.md) and [docs/roadmap.md](docs/roadmap.md)
- [SECURITY.md](SECURITY.md)

## Repository layout

```
src/fluent/            Fluent definitions (*.now.ts): tables, ACLs, properties, script includes,
                       business rules, REST API, widgets, pages, menu, starter tools, ATF test
src/scripts/           Server scripts included by the Fluent records (ES5 style)
  script-includes/     WayfinderStore, WayfinderAzureClient, WayfinderBotApiClient, WayfinderTools, WayfinderAgent
  business-rules/      job-runner.js, confirm-runner.js
  rest/                va-inbound.js
  atf/                 security acceptance test script
src/widgets/           wayfinder-chat and wayfinder-tool-builder (template, SCSS, client, server)
scripts/               one-time background scripts (Virtual Agent provider setup)
test/                  offline unit tests (node:test with Glide fakes)
```

## Credentials

Nothing secret is stored in this repository. The API key, Bot API password and token, and the webhook secret are `password2` (encrypted) system properties that you set on the instance after installing.

## License

Not yet decided (`package.json` says `UNLICENSED`).
