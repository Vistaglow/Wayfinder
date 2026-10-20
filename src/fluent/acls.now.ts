import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'

// Conversations, messages and chat jobs: only the owner of the conversation.
// Platform admins pass through adminOverrides. Tool catalog: any signed-in user
// can read it (the agent lists tools as the caller); only Wayfinder admins change it.
// Fluent source files cannot contain loops, so each ACL is written out.

const OWNS_CONVERSATION = "answer = (current.getValue('user') == gs.getUserID());"
const OWNS_PARENT = 'answer = (String(current.conversation.user) == gs.getUserID());'

Acl({
    $id: Now.ID['acl_conversation_read'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_conversation',
    operation: 'read',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_CONVERSATION,
    description: 'Wayfinder: only the conversation owner can read it.',
})

Acl({
    $id: Now.ID['acl_conversation_write'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_conversation',
    operation: 'write',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_CONVERSATION,
    description: 'Wayfinder: only the conversation owner can write it.',
})

Acl({
    $id: Now.ID['acl_conversation_create'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_conversation',
    operation: 'create',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_CONVERSATION,
    description: 'Wayfinder: only the conversation owner can create it.',
})

Acl({
    $id: Now.ID['acl_conversation_delete'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_conversation',
    operation: 'delete',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_CONVERSATION,
    description: 'Wayfinder: only the conversation owner can delete it.',
})

Acl({
    $id: Now.ID['acl_message_read'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_message',
    operation: 'read',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can read its messages.',
})

Acl({
    $id: Now.ID['acl_message_write'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_message',
    operation: 'write',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can write its messages.',
})

Acl({
    $id: Now.ID['acl_message_create'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_message',
    operation: 'create',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can create its messages.',
})

Acl({
    $id: Now.ID['acl_message_delete'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_message',
    operation: 'delete',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can delete its messages.',
})

Acl({
    $id: Now.ID['acl_job_read'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_chat_job',
    operation: 'read',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can read its chat jobs.',
})

Acl({
    $id: Now.ID['acl_job_write'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_chat_job',
    operation: 'write',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can write its chat jobs.',
})

Acl({
    $id: Now.ID['acl_job_create'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_chat_job',
    operation: 'create',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can create its chat jobs.',
})

Acl({
    $id: Now.ID['acl_job_delete'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_chat_job',
    operation: 'delete',
    decisionType: 'allow',
    adminOverrides: true,
    script: OWNS_PARENT,
    description: 'Wayfinder: only the conversation owner can delete its chat jobs.',
})

Acl({
    $id: Now.ID['acl_tool_read'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_tool',
    operation: 'read',
    decisionType: 'allow',
    adminOverrides: true,
    script: 'answer = gs.isLoggedIn();',
    description: 'Wayfinder: any authenticated user can read the tool catalog.',
})

Acl({
    $id: Now.ID['acl_tool_write'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_tool',
    operation: 'write',
    decisionType: 'allow',
    adminOverrides: true,
    roles: ['x_snc_wayfinder_ai.admin'],
    description: 'Wayfinder: only Wayfinder admins can write tools.',
})

Acl({
    $id: Now.ID['acl_tool_create'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_tool',
    operation: 'create',
    decisionType: 'allow',
    adminOverrides: true,
    roles: ['x_snc_wayfinder_ai.admin'],
    description: 'Wayfinder: only Wayfinder admins can create tools.',
})

Acl({
    $id: Now.ID['acl_tool_delete'],
    type: 'record',
    table: 'x_snc_wayfinder_ai_tool',
    operation: 'delete',
    decisionType: 'allow',
    adminOverrides: true,
    roles: ['x_snc_wayfinder_ai.admin'],
    description: 'Wayfinder: only Wayfinder admins can delete tools.',
})
