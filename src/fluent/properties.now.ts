import '@servicenow/sdk/global'
import { Property } from '@servicenow/sdk/core'

// Every property is installed on FIRST INSTALL only ($meta.installMethod), so
// updating the app never overwrites values an operator has set. Values here are
// placeholders; secrets are password2 (two-way encrypted) and start empty.
// Read and write are limited to admins; server code still reads them with gs.getProperty.

const ADMIN_ONLY = { read: ['admin', 'x_snc_wayfinder_ai.admin'], write: ['admin'] }

Property({
    $id: Now.ID['prop_azure_endpoint'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.azure_endpoint',
    type: 'string',
    value: 'https://YOUR-RESOURCE.openai.azure.com',
    description: 'Azure OpenAI / AI Foundry endpoint, https only, no trailing slash.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_azure_deployment'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.azure_deployment',
    type: 'string',
    value: 'gpt-4o-mini',
    description: 'Deployment name of the chat model (it must support tool calling).',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_azure_api_version'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.azure_api_version',
    type: 'string',
    value: '2024-08-01-preview',
    description: 'Azure OpenAI REST api-version query parameter.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_azure_api_key'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.azure_api_key',
    type: 'password2',
    value: '',
    description: 'Azure OpenAI API key (encrypted). Wayfinder refuses to call the model while this is empty.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_azure_timeout_ms'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.azure_timeout_ms',
    type: 'integer',
    value: 120000,
    description: 'HTTP timeout for one model call, in milliseconds.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_azure_temperature'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.azure_temperature',
    type: 'string',
    value: '',
    description: 'Sampling temperature sent to the model, e.g. 0.7. Leave empty for reasoning models (gpt-5 family, o-series), which only accept their default.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_system_prompt'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.system_prompt',
    type: 'string',
    value: Now.include('./system-prompt.txt'),
    description: 'System prompt sent at the start of every conversation. Empty = built-in default.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_use_bot_api'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.use_bot_api',
    type: 'boolean',
    value: 'false',
    description: 'Turn on live-agent handoff through the Virtual Agent Bot Integration API. Off by default.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_bot_api_basic_user'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.bot_api_basic_user',
    type: 'string',
    value: '',
    description: 'Basic Auth user for the VA Bot Integration API.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_bot_api_basic_password'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.bot_api_basic_password',
    type: 'password2',
    value: '',
    description: 'Basic Auth password for the VA Bot Integration API (encrypted).',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_bot_api_token'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.bot_api_token',
    type: 'password2',
    value: '',
    description: 'Token from the token_verification record for the Wayfinder provider (encrypted).',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_bot_api_live_agent_topic'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.bot_api_live_agent_topic_sys_id',
    type: 'string',
    value: '',
    description: 'sys_id of the "Live Agent Support" Virtual Agent topic (sys_cs_topic).',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_bot_api_timeout_ms'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.bot_api_timeout_ms',
    type: 'integer',
    value: 30000,
    description: 'HTTP timeout for VA Bot Integration API calls, in milliseconds.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_va_inbound_secret'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.va_inbound_secret',
    type: 'password2',
    value: '',
    description: 'Shared secret the VA outbound webhook must send in the X-Wayfinder-Secret header. Empty = all callbacks rejected.',
    roles: ADMIN_ONLY,
})

Property({
    $id: Now.ID['prop_portal_suffix'],
    $meta: { installMethod: 'first install' },
    name: 'x_snc_wayfinder_ai.portal_suffix',
    type: 'string',
    value: 'esc',
    description: 'Portal URL suffix used in links the assistant generates (esc or sp).',
    roles: ADMIN_ONLY,
})
