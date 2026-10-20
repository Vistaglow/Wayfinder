import '@servicenow/sdk/global'
import { Table, StringColumn, ReferenceColumn, BooleanColumn, IntegerColumn } from '@servicenow/sdk/core'

// One row per chat thread.
export const x_snc_wayfinder_ai_conversation = Table({
    name: 'x_snc_wayfinder_ai_conversation',
    label: 'Wayfinder Conversation',
    display: 'title',
    accessibleFrom: 'public',
    actions: { read: true },
    allowWebServiceAccess: false,
    schema: {
        user: ReferenceColumn({ label: 'User', referenceTable: 'sys_user', mandatory: true }),
        title: StringColumn({ label: 'Title', maxLength: 255, default: 'New chat' }),
        mode: StringColumn({
            label: 'Mode',
            maxLength: 20,
            default: 'ai',
            dropdown: 'dropdown_without_none',
            choices: {
                ai: { label: 'AI assistant', sequence: 10 },
                agent: { label: 'Live agent', sequence: 20 },
            },
        }),
        interaction: ReferenceColumn({ label: 'Interaction', referenceTable: 'interaction' }),
        agent_conversation: StringColumn({ label: 'Agent conversation', maxLength: 32 }),
    },
    index: [{ name: 'x_snc_wayfinder_ai_conv_user', unique: false, element: 'user' }],
})

// One row per message. `seq` is a millisecond-precision ordering key, because
// sys_created_on only has 1-second precision.
export const x_snc_wayfinder_ai_message = Table({
    name: 'x_snc_wayfinder_ai_message',
    label: 'Wayfinder Message',
    accessibleFrom: 'public',
    actions: { read: true },
    allowWebServiceAccess: false,
    schema: {
        conversation: ReferenceColumn({
            label: 'Conversation',
            referenceTable: 'x_snc_wayfinder_ai_conversation',
            mandatory: true,
            cascadeRule: 'cascade',
        }),
        role: StringColumn({
            label: 'Role',
            maxLength: 40,
            mandatory: true,
            dropdown: 'dropdown_without_none',
            choices: {
                user: { label: 'User', sequence: 10 },
                assistant: { label: 'Assistant', sequence: 20 },
                tool: { label: 'Tool', sequence: 30 },
            },
        }),
        content: StringColumn({ label: 'Content', maxLength: 65535 }),
        tool_name: StringColumn({ label: 'Tool name', maxLength: 100 }),
        tool_call_id: StringColumn({ label: 'Tool call ID', maxLength: 100 }),
        tool_calls: StringColumn({ label: 'Tool calls (JSON)', maxLength: 65535 }),
        source: StringColumn({ label: 'Source', maxLength: 40 }),
        agent_name: StringColumn({ label: 'Agent name', maxLength: 100 }),
        seq: StringColumn({ label: 'Sequence', maxLength: 20 }),
    },
    index: [
        { name: 'x_snc_wayfinder_ai_msg_conv_seq', unique: false, element: ['conversation', 'seq'] },
        { name: 'x_snc_wayfinder_ai_msg_conv_created', unique: false, element: ['conversation', 'sys_created_on'] },
    ],
})

// Async work item: the widget inserts one per AI turn and polls it.
export const x_snc_wayfinder_ai_chat_job = Table({
    name: 'x_snc_wayfinder_ai_chat_job',
    label: 'Wayfinder Chat Job',
    accessibleFrom: 'public',
    actions: { read: true },
    allowWebServiceAccess: false,
    schema: {
        conversation: ReferenceColumn({
            label: 'Conversation',
            referenceTable: 'x_snc_wayfinder_ai_conversation',
            mandatory: true,
            cascadeRule: 'cascade',
        }),
        user_message: StringColumn({ label: 'User message', maxLength: 65535 }),
        status: StringColumn({
            label: 'Status',
            maxLength: 40,
            default: 'new',
            dropdown: 'dropdown_without_none',
            choices: {
                new: { label: 'New', sequence: 10 },
                running: { label: 'Running', sequence: 20 },
                tool_call: { label: 'Calling a tool', sequence: 30 },
                streaming: { label: 'Streaming', sequence: 40 },
                awaiting_confirmation: { label: 'Awaiting confirmation', sequence: 50 },
                confirmed: { label: 'Confirmed', sequence: 60 },
                cancelled: { label: 'Cancelled', sequence: 70 },
                complete: { label: 'Complete', sequence: 80 },
                error: { label: 'Error', sequence: 90 },
            },
        }),
        content: StringColumn({ label: 'Final reply', maxLength: 65535 }),
        last_tool: StringColumn({ label: 'Last tool', maxLength: 100 }),
        error_message: StringColumn({ label: 'Error', maxLength: 1024 }),
        pending_tool_calls: StringColumn({ label: 'Pending tool calls (JSON)', maxLength: 65535 }),
    },
    index: [{ name: 'x_snc_wayfinder_ai_job_conv', unique: false, element: 'conversation' }],
})

// The admin-defined tool catalog the model can call.
export const x_snc_wayfinder_ai_tool = Table({
    name: 'x_snc_wayfinder_ai_tool',
    label: 'Wayfinder Tool',
    display: 'name',
    accessibleFrom: 'public',
    actions: { read: true },
    allowWebServiceAccess: false,
    schema: {
        name: StringColumn({ label: 'Name', maxLength: 80, mandatory: true }),
        description: StringColumn({ label: 'Description (routing instructions)', maxLength: 4000 }),
        enabled: BooleanColumn({ label: 'Available to the AI', default: true }),
        kind: StringColumn({
            label: 'Kind',
            maxLength: 20,
            default: 'table',
            dropdown: 'dropdown_without_none',
            choices: {
                table: { label: 'Table (generic GlideRecord)', sequence: 10 },
                builtin: { label: 'Built-in (code handler)', sequence: 20 },
            },
        }),
        operation: StringColumn({
            label: 'Operation',
            maxLength: 20,
            default: 'read',
            dropdown: 'dropdown_without_none',
            choices: {
                read: { label: 'Read', sequence: 10 },
                update: { label: 'Update', sequence: 20 },
                create: { label: 'Create', sequence: 30 },
            },
        }),
        parameters_json: StringColumn({ label: 'Parameters (JSON)', maxLength: 8000, default: '[]' }),
        target_table: StringColumn({ label: 'Target table', maxLength: 80 }),
        encoded_query_template: StringColumn({ label: 'Encoded query template', maxLength: 4000 }),
        return_fields: StringColumn({ label: 'Fields to return', maxLength: 2000 }),
        max_results: IntegerColumn({ label: 'Default max results', default: 10 }),
        require_confirmation: BooleanColumn({ label: 'Ask for approval before running', default: false }),
    },
    index: [{ name: 'x_snc_wayfinder_ai_tool_name', unique: true, element: 'name' }],
})
