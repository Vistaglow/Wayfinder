# Azure OpenAI / AI Foundry

## Create the deployment

1. In the Azure portal, create an **Azure OpenAI** resource (or an AI Foundry project). East US 2 and Sweden Central usually have the widest model availability.
2. Deploy **gpt-4o-mini** (cheapest, good at tool calling) or **gpt-4o**.
3. Copy the endpoint (`https://<resource>.openai.azure.com`) and a key from **Keys and Endpoint**.
4. Put them in `x_snc_wayfinder_ai.azure_endpoint`, `azure_deployment` and `azure_api_key`.

## Smoke tests

Use placeholders and environment variables; don't paste keys into files.

```bash
export AZ_ENDPOINT="https://YOUR-RESOURCE.openai.azure.com"
export AZ_DEPLOYMENT="gpt-4o-mini"
export AZ_KEY="..."   # from the portal
URL="$AZ_ENDPOINT/openai/deployments/$AZ_DEPLOYMENT/chat/completions?api-version=2024-08-01-preview"

# Hello
curl -s "$URL" -H "api-key: $AZ_KEY" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}'

# Tool calling: the reply must contain "tool_calls" with get_incident
curl -s "$URL" -H "api-key: $AZ_KEY" -H "Content-Type: application/json" -d '{
  "messages":[{"role":"user","content":"What is the status of INC0010001?"}],
  "tools":[{"type":"function","function":{"name":"get_incident","description":"Get an incident by number",
    "parameters":{"type":"object","properties":{"number":{"type":"string"}},"required":["number"]}}}]
}'
```

If the second call answers in text instead of returning `tool_calls`, the deployment doesn't support tools and Wayfinder will only chat.

## Network

Azure OpenAI endpoints are public. If your instance filters outbound traffic, allow `*.openai.azure.com` (or your exact resource host).

## Cost

gpt-4o-mini is roughly $0.15 per million input tokens and $0.60 per million output tokens (check current Azure pricing for your region). One chat turn is typically 2,000–3,000 input tokens (system prompt, tool definitions, history) and about 200 output tokens, so a fraction of a cent. Turns that call tools make one model call per tool round.

## Optional: Entra ID instead of a key

`WayfinderAzureClient._applyAuth()` is the only place the auth header is built. To move off API keys, register an app (or use a managed identity through a gateway), grant it **Cognitive Services OpenAI User** on the resource, fetch a client-credentials token for `https://cognitiveservices.azure.com/.default` (for example through a ServiceNow OAuth profile), and set `Authorization: Bearer <token>` there instead of `api-key`.
