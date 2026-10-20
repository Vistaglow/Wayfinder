# Azure OpenAI / AI Foundry

## Create the deployment

1. In the Azure portal or [Azure AI Foundry](https://ai.azure.com), create an **Azure OpenAI** resource or a Foundry project. Foundry usually creates the resource for you and names it `<project>-resource`.
2. In the model catalog, pick a current small chat model that supports tool calling and is **not** marked *Deprecated*, for example a gpt-5-family "mini" model. Model availability and retirement dates change often and differ by region and deployment type; check the [model retirement schedule](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule) before you choose.
3. Click **Deploy** and note the **deployment name** you give it. Wayfinder needs the deployment name, not the model name. Opening a model in the catalog does not deploy it.
4. From **Keys and Endpoint** (or the deployment's details page), copy:
   - the **endpoint host**: `https://<resource>.openai.azure.com`. The portal may show a longer URL such as `https://<resource>.openai.azure.com/openai/v1`; use only the part before `/openai`.
   - a **key**. Treat it like a password: don't paste it into chats, tickets or files. If it leaks, click **Regenerate** for that key.

A new deployment can take a few minutes before it answers.

## Smoke test

Run this before you configure ServiceNow. It checks the endpoint, deployment, key and api-version, and that the model calls tools. Newer models need a newer api-version than Wayfinder's installed default; `2025-04-01-preview` is a reasonable start, and if Azure rejects it, the error lists the versions it accepts.

### PowerShell (Windows)

```powershell
$endpoint   = "https://YOUR-RESOURCE.openai.azure.com"
$deployment = "YOUR-DEPLOYMENT-NAME"
$apiVersion = "2025-04-01-preview"
$key        = Get-Clipboard          # copy the key first; see the paste note below
$url = "$endpoint/openai/deployments/$deployment/chat/completions?api-version=$apiVersion"
$headers = @{ "api-key" = $key.Trim() }

# 1. Hello
$body = '{"messages":[{"role":"user","content":"Say hello"}]}'
(Invoke-RestMethod -Uri $url -Method Post -Headers $headers -ContentType "application/json" -Body $body).choices[0].message.content

# 2. Tool calling: should print get_incident and {"number":"INC0010001"}
$body = @'
{"messages":[{"role":"user","content":"What is the status of INC0010001?"}],
 "tools":[{"type":"function","function":{"name":"get_incident","description":"Get an incident by number",
   "parameters":{"type":"object","properties":{"number":{"type":"string"}},"required":["number"]}}}]}
'@
(Invoke-RestMethod -Uri $url -Method Post -Headers $headers -ContentType "application/json" -Body $body).choices[0].message.tool_calls.function
```

Pasting the key: in Windows PowerShell 5.1, **Ctrl+V at a hidden `Read-Host -AsSecureString` prompt types an invisible `^V` instead of pasting**, and the request then fails with "Specified value has invalid Control characters". Use `Get-Clipboard` as above, or right-click to paste. In PowerShell 5.1, call `curl.exe` explicitly if you use curl; plain `curl` is an alias for `Invoke-WebRequest`.

Tip: a fuller version of this test with PASS/FAIL output and hints is easy to keep as `scripts/<name>.local.ps1`; files ending in `.local.ps1` are git-ignored.

### Bash (macOS, Linux, WSL)

```bash
export AZ_ENDPOINT="https://YOUR-RESOURCE.openai.azure.com"
export AZ_DEPLOYMENT="YOUR-DEPLOYMENT-NAME"
read -rs -p "Key: " AZ_KEY; echo
URL="$AZ_ENDPOINT/openai/deployments/$AZ_DEPLOYMENT/chat/completions?api-version=2025-04-01-preview"

curl -s "$URL" -H "api-key: $AZ_KEY" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}'

curl -s "$URL" -H "api-key: $AZ_KEY" -H "Content-Type: application/json" -d '{
  "messages":[{"role":"user","content":"What is the status of INC0010001?"}],
  "tools":[{"type":"function","function":{"name":"get_incident","description":"Get an incident by number",
    "parameters":{"type":"object","properties":{"number":{"type":"string"}},"required":["number"]}}}]
}'
```

### Reading the result

| Result | Meaning |
|---|---|
| A greeting, then a `get_incident` call | Ready. Put the same endpoint, deployment name, api-version and key in the Wayfinder properties ([setup.md](setup.md#2-set-the-properties)). |
| 401 | Wrong key, or a key from a different resource than the endpoint. |
| 404 `DeploymentNotFound` | The resource exists but has no deployment by that name: wrong resource in the endpoint, the model name used instead of the deployment name, or a deployment that is still starting. |
| 400 about api-version | Use a newer api-version (the error lists valid ones). |
| Test 2 answers in text, no tool call | The model doesn't support tool calling; Wayfinder would only chat. Deploy another model. |
| "invalid Control characters" | The key contains a stray character (see the paste note). Nothing was sent. |

## Temperature and reasoning models

Reasoning models (gpt-5 family, o-series) accept only their default temperature and return HTTP 400 for any other value. Wayfinder therefore sends no temperature unless `x_snc_wayfinder_ai.azure_temperature` is set; leave it empty for these models. The smoke test above sends no temperature either, so it won't catch a wrong setting there.

## Network

Azure OpenAI endpoints are public. If your instance filters outbound traffic, allow `*.openai.azure.com` (or your exact resource host).

## Cost

Small "mini" models cost a fraction of a dollar per million tokens; check current Azure pricing for your model and region. One Wayfinder turn is typically 2,000–3,000 input tokens (system prompt, tool definitions, history) and a few hundred output tokens, plus one more model call per round of tool calls. Reasoning models also bill their hidden reasoning tokens as output, so expect higher output counts than with older models.

## Optional: Entra ID instead of a key

`WayfinderAzureClient._applyAuth()` is the only place the auth header is built. To move off API keys, register an app (or use a managed identity through a gateway), grant it **Cognitive Services OpenAI User** on the resource, fetch a client-credentials token for `https://cognitiveservices.azure.com/.default` (for example through a ServiceNow OAuth profile), and set `Authorization: Bearer <token>` there instead of `api-key`.
