import '@servicenow/sdk/global'
import { ScriptInclude, BusinessRule, RestApi } from '@servicenow/sdk/core'

// ---- Script Includes (ES5-style Class.create, called as x_snc_wayfinder_ai.<Name>) ----

ScriptInclude({
    $id: Now.ID['si_wayfinder_store'],
    name: 'WayfinderStore',
    apiName: 'x_snc_wayfinder_ai.WayfinderStore',
    accessibleFrom: 'package_private',
    active: true,
    description: 'Wayfinder data helpers: conversations, messages, jobs, ownership checks.',
    script: Now.include('../scripts/script-includes/WayfinderStore.js'),
})

ScriptInclude({
    $id: Now.ID['si_wayfinder_azure_client'],
    name: 'WayfinderAzureClient',
    apiName: 'x_snc_wayfinder_ai.WayfinderAzureClient',
    accessibleFrom: 'package_private',
    active: true,
    description: 'Calls the Azure OpenAI chat-completions endpoint.',
    script: Now.include('../scripts/script-includes/WayfinderAzureClient.js'),
})

ScriptInclude({
    $id: Now.ID['si_wayfinder_bot_api_client'],
    name: 'WayfinderBotApiClient',
    apiName: 'x_snc_wayfinder_ai.WayfinderBotApiClient',
    accessibleFrom: 'package_private',
    active: true,
    description: 'Calls the Virtual Agent Bot Integration API for live-agent handoff.',
    script: Now.include('../scripts/script-includes/WayfinderBotApiClient.js'),
})

ScriptInclude({
    $id: Now.ID['si_wayfinder_tools'],
    name: 'WayfinderTools',
    apiName: 'x_snc_wayfinder_ai.WayfinderTools',
    accessibleFrom: 'package_private',
    active: true,
    description: 'Wayfinder tool catalog and execution: generic table tools and built-in handlers.',
    script: Now.include('../scripts/script-includes/WayfinderTools.js'),
})

ScriptInclude({
    $id: Now.ID['si_wayfinder_agent'],
    name: 'WayfinderAgent',
    apiName: 'x_snc_wayfinder_ai.WayfinderAgent',
    accessibleFrom: 'package_private',
    active: true,
    description: 'Wayfinder tool loop: history, model calls, tool execution and the confirmation gate.',
    script: Now.include('../scripts/script-includes/WayfinderAgent.js'),
})

// ---- Async business rules: the agent loop runs here, off the widget transaction ----

BusinessRule({
    $id: Now.ID['br_run_chat_job'],
    name: 'Wayfinder - run chat job',
    table: 'x_snc_wayfinder_ai_chat_job',
    when: 'async',
    action: ['insert'],
    order: 100,
    active: true,
    condition: "current.status == 'new'",
    description: 'Runs the Wayfinder agent loop for a new chat job, as the user who sent the message.',
    script: Now.include('../scripts/business-rules/job-runner.js'),
})

BusinessRule({
    $id: Now.ID['br_resume_chat_job'],
    name: 'Wayfinder - resume after confirmation',
    table: 'x_snc_wayfinder_ai_chat_job',
    when: 'async',
    action: ['update'],
    order: 100,
    active: true,
    condition: "current.status.changesTo('confirmed') || current.status.changesTo('cancelled')",
    description: 'Runs or declines tool calls the user approved or cancelled, then continues the agent loop.',
    script: Now.include('../scripts/business-rules/confirm-runner.js'),
})

// ---- Scripted REST: Virtual Agent outbound webhook ----
// URL: /api/x_snc_wayfinder_ai/wayfinder/va_inbound

RestApi({
    $id: Now.ID['rest_wayfinder'],
    name: 'Wayfinder Chat',
    serviceId: 'wayfinder',
    shortDescription: 'Receives live-agent messages from the Virtual Agent provider webhook.',
    consumes: 'application/json',
    produces: 'application/json',
    routes: [
        {
            $id: Now.ID['rest_wayfinder_va_inbound'],
            name: 'va_inbound',
            method: 'POST',
            path: '/va_inbound',
            authentication: true,
            authorization: false,
            consumes: 'application/json',
            produces: 'application/json',
            shortDescription: 'VA outbound webhook. Requires authentication and the X-Wayfinder-Secret header.',
            headers: [
                {
                    $id: Now.ID['rest_wayfinder_va_inbound_secret'],
                    name: 'X-Wayfinder-Secret',
                    required: true,
                    shortDescription: 'Must equal the x_snc_wayfinder_ai.va_inbound_secret property.',
                    exampleValue: 'CHANGE_ME',
                },
            ],
            script: Now.include('../scripts/rest/va-inbound.js'),
        },
    ],
})
