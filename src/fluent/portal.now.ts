import '@servicenow/sdk/global'
import { SPWidget, SPPage } from '@servicenow/sdk/core'

export const wayfinderChatWidget = SPWidget({
    $id: Now.ID['widget_wayfinder_chat'],
    id: 'wayfinder-chat',
    name: 'Wayfinder Chat',
    description: 'Wayfinder AI assistant chat: conversations, tool cards, approvals and live-agent handoff.',
    controllerAs: 'c',
    htmlTemplate: Now.include('../widgets/wayfinder-chat/template.html'),
    customCss: Now.include('../widgets/wayfinder-chat/style.scss'),
    clientScript: Now.include('../widgets/wayfinder-chat/client.js'),
    serverScript: Now.include('../widgets/wayfinder-chat/server.js'),
    hasPreview: false,
})

export const wayfinderToolBuilderWidget = SPWidget({
    $id: Now.ID['widget_wayfinder_tool_builder'],
    id: 'wayfinder-tool-builder',
    name: 'Wayfinder Tool Builder',
    description: 'Point-and-click builder for the tools the Wayfinder AI can call.',
    controllerAs: 'c',
    htmlTemplate: Now.include('../widgets/wayfinder-tool-builder/template.html'),
    customCss: Now.include('../widgets/wayfinder-tool-builder/style.scss'),
    clientScript: Now.include('../widgets/wayfinder-tool-builder/client.js'),
    serverScript: Now.include('../widgets/wayfinder-tool-builder/server.js'),
    hasPreview: false,
})

// /sp?id=wayfinder (any portal works: /esc?id=wayfinder)
export const wayfinderPage = SPPage({
    pageId: 'wayfinder',
    title: 'Wayfinder',
    shortDescription: 'Wayfinder AI assistant',
    public: false,
    containers: [
        {
            $id: Now.ID['page_wayfinder_container'],
            name: 'Wayfinder - main',
            width: 'container',
            order: 100,
            rows: [
                {
                    $id: Now.ID['page_wayfinder_row'],
                    order: 100,
                    columns: [
                        {
                            $id: Now.ID['page_wayfinder_col'],
                            size: 12,
                            sizeSm: 12,
                            sizeXs: 12,
                            order: 100,
                            instances: [
                                {
                                    $id: Now.ID['page_wayfinder_instance'],
                                    widget: wayfinderChatWidget,
                                    order: 100,
                                    active: true,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
})

// /sp?id=wayfinder-tools: signed-in users see the tools read-only (the catalog is
// readable anyway); the widget server checks x_snc_wayfinder_ai.admin on every change and test.
export const wayfinderToolsPage = SPPage({
    pageId: 'wayfinder-tools',
    title: 'Wayfinder Tools',
    shortDescription: 'Build and test the tools the Wayfinder AI can call',
    public: false,
    containers: [
        {
            $id: Now.ID['page_wayfinder_tools_container'],
            name: 'Wayfinder Tools - main',
            width: 'container',
            order: 100,
            rows: [
                {
                    $id: Now.ID['page_wayfinder_tools_row'],
                    order: 100,
                    columns: [
                        {
                            $id: Now.ID['page_wayfinder_tools_col'],
                            size: 12,
                            sizeSm: 12,
                            sizeXs: 12,
                            order: 100,
                            instances: [
                                {
                                    $id: Now.ID['page_wayfinder_tools_instance'],
                                    widget: wayfinderToolBuilderWidget,
                                    order: 100,
                                    active: true,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
})
