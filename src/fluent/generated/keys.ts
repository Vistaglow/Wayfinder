import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '6eb8f705a6d642cba0e1dd5618912191'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'c5448691ade642e087583394b2887915'
                    }
                }
                composite: [
                    {
                        table: 'sys_user_role'
                        id: '584853093b0cdf102d67da31a3e45a27'
                        key: {
                            name: 'x_snc_wayfinder_ai.admin'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'd84853093b0cdf102d67da31a3e45a35'
                        key: {
                            name: 'x_snc_wayfinder_ai.user'
                        }
                    },
                ]
            }
        }
    }
}
