import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'

export const wayfinderMenu = ApplicationMenu({
    $id: Now.ID['menu_wayfinder'],
    title: 'Wayfinder AI',
    hint: 'In-platform AI assistant',
    description: 'Wayfinder AI assistant: chat, tools and configuration.',
    active: true,
})

Record({
    $id: Now.ID['module_chat'],
    table: 'sys_app_module',
    data: {
        title: 'Chat',
        application: wayfinderMenu,
        link_type: 'DIRECT',
        query: 'sp?id=wayfinder',
        window_name: '_blank',
        hint: 'Open the Wayfinder chat in Service Portal (new window)',
        order: 100,
        active: true,
    },
})

Record({
    $id: Now.ID['module_tool_builder'],
    table: 'sys_app_module',
    data: {
        title: 'Tool builder',
        application: wayfinderMenu,
        link_type: 'DIRECT',
        query: 'sp?id=wayfinder-tools',
        window_name: '_blank',
        hint: 'Build and test the tools the AI can call (new window)',
        roles: ['x_snc_wayfinder_ai.admin'],
        order: 200,
        active: true,
    },
})

Record({
    $id: Now.ID['module_configuration'],
    table: 'sys_app_module',
    data: {
        title: 'Configuration',
        application: wayfinderMenu,
        link_type: 'SEPARATOR',
        roles: ['x_snc_wayfinder_ai.admin'],
        order: 1000,
        active: true,
    },
})

Record({
    $id: Now.ID['module_properties'],
    table: 'sys_app_module',
    data: {
        title: 'Properties',
        application: wayfinderMenu,
        link_type: 'LIST',
        name: 'sys_properties',
        filter: 'nameSTARTSWITHx_snc_wayfinder_ai.',
        roles: ['admin'],
        order: 1100,
        active: true,
    },
})

Record({
    $id: Now.ID['module_tools'],
    table: 'sys_app_module',
    data: {
        title: 'Tools',
        application: wayfinderMenu,
        link_type: 'LIST',
        name: 'x_snc_wayfinder_ai_tool',
        roles: ['x_snc_wayfinder_ai.admin'],
        order: 1200,
        active: true,
    },
})

Record({
    $id: Now.ID['module_conversations'],
    table: 'sys_app_module',
    data: {
        title: 'Conversations',
        application: wayfinderMenu,
        link_type: 'LIST',
        name: 'x_snc_wayfinder_ai_conversation',
        roles: ['admin'],
        order: 1300,
        active: true,
    },
})

Record({
    $id: Now.ID['module_jobs'],
    table: 'sys_app_module',
    data: {
        title: 'Chat jobs',
        application: wayfinderMenu,
        link_type: 'LIST',
        name: 'x_snc_wayfinder_ai_chat_job',
        roles: ['admin'],
        order: 1400,
        active: true,
    },
})
