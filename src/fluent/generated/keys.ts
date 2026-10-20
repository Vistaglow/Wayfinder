import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    acl_conversation_create: {
                        table: 'sys_security_acl'
                        id: '9c17d8fae1254b7fa738931b8cfae838'
                    }
                    acl_conversation_delete: {
                        table: 'sys_security_acl'
                        id: '79e312cd3ee0454b84041e8bb1535734'
                    }
                    acl_conversation_read: {
                        table: 'sys_security_acl'
                        id: 'ac7e1e317149426c88bd27e66e7f075e'
                    }
                    acl_conversation_write: {
                        table: 'sys_security_acl'
                        id: '5f2ac2590e3e4940ba5918ee1b91875e'
                    }
                    acl_job_create: {
                        table: 'sys_security_acl'
                        id: 'db6c527d041f4fea9216deb9edabfc5a'
                    }
                    acl_job_delete: {
                        table: 'sys_security_acl'
                        id: '04703c7f0a0e428ba60e9e9ba4b858c8'
                    }
                    acl_job_read: {
                        table: 'sys_security_acl'
                        id: '9ed59fd739744eefbb54560e58815a16'
                    }
                    acl_job_write: {
                        table: 'sys_security_acl'
                        id: 'c085fa6a59c744c98f0dc33da2b8be22'
                    }
                    acl_message_create: {
                        table: 'sys_security_acl'
                        id: 'f5f181e15666462499dd4c4912cff3ce'
                    }
                    acl_message_delete: {
                        table: 'sys_security_acl'
                        id: 'fa1b6c65a78f48f7adb682d0548d1398'
                    }
                    acl_message_read: {
                        table: 'sys_security_acl'
                        id: '1e35db223a794ed4bd330b04af3ace73'
                    }
                    acl_message_write: {
                        table: 'sys_security_acl'
                        id: 'f6c0f14cf7d04e6882ccb95419dab58f'
                    }
                    acl_tool_create: {
                        table: 'sys_security_acl'
                        id: '26b52bb73fe7450db807cb6fe589aa70'
                    }
                    acl_tool_delete: {
                        table: 'sys_security_acl'
                        id: 'e29500d3c4394f34b064e002526b18f0'
                    }
                    acl_tool_read: {
                        table: 'sys_security_acl'
                        id: '065b5f9998a04d9a9d8856f4825fc23c'
                    }
                    acl_tool_write: {
                        table: 'sys_security_acl'
                        id: '38be8f7c13b34967a26f521cd0d788d7'
                    }
                    atf_wayfinder_acl_script: {
                        table: 'sys_atf_step'
                        id: '4caa5e9d48444f9c9b34421182d96d5e'
                    }
                    atf_wayfinder_create_user: {
                        table: 'sys_atf_step'
                        id: '83c1b7ea941b40f1afec7f3f46eab253'
                    }
                    atf_wayfinder_tools_respect_acls: {
                        table: 'sys_atf_test'
                        id: '2a6e1f84db654fa280476f010d846161'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '6eb8f705a6d642cba0e1dd5618912191'
                    }
                    br_resume_chat_job: {
                        table: 'sys_script'
                        id: '8dd0e30f88f7444e86b8072967859438'
                    }
                    br_run_chat_job: {
                        table: 'sys_script'
                        id: '3adefbc24b9a4cd49e8456a61611f37c'
                    }
                    csp_cartjs_execute: {
                        table: 'sys_scope_privilege'
                        id: 'c0856c90346f43c6aaeb337bfc59f5e1'
                    }
                    csp_catitem_execute: {
                        table: 'sys_scope_privilege'
                        id: '8e60bdf632f945aeb22af02f09a7a020'
                    }
                    csp_io_set_item_read: {
                        table: 'sys_scope_privilege'
                        id: '8c2a151ae1d941f89c20451ed42eeb42'
                    }
                    csp_item_option_new_read: {
                        table: 'sys_scope_privilege'
                        id: '5440ad430246448082c26ba86387f628'
                    }
                    csp_kb_knowledge_read: {
                        table: 'sys_scope_privilege'
                        id: '338be3e15eca47a39b1d949f6d0d3c73'
                    }
                    csp_question_choice_read: {
                        table: 'sys_scope_privilege'
                        id: '01dd19e53c694d3f82e08de8952f70f1'
                    }
                    csp_sc_cat_item_read: {
                        table: 'sys_scope_privilege'
                        id: '4f7f6d5b695042a4a58185405132367b'
                    }
                    csp_sc_req_item_read: {
                        table: 'sys_scope_privilege'
                        id: 'b083cf6071e94da58f0c496549fb63d7'
                    }
                    csp_sc_request_read: {
                        table: 'sys_scope_privilege'
                        id: '90bb512d134a42a2adcc1662bd34390b'
                    }
                    csp_sys_choice_read: {
                        table: 'sys_scope_privilege'
                        id: 'e543233bcf434d62a877d652be122122'
                    }
                    csp_sys_db_object_read: {
                        table: 'sys_scope_privilege'
                        id: '116fd13738d94ee8b3e9415b8f8fc8e4'
                    }
                    csp_sys_dictionary_read: {
                        table: 'sys_scope_privilege'
                        id: '941f1ae35fa046e4a637bf4f63c9fd28'
                    }
                    csp_sys_user_read: {
                        table: 'sys_scope_privilege'
                        id: 'a8577d96a0b94f9a968d19d9f0b538a3'
                    }
                    csp_task_read: {
                        table: 'sys_scope_privilege'
                        id: '7215d9dfc6b145568b735771ddee2fc4'
                    }
                    csp_task_write: {
                        table: 'sys_scope_privilege'
                        id: '6814c2144a824b9e9a90e717f6083802'
                    }
                    menu_wayfinder: {
                        table: 'sys_app_application'
                        id: '922a35888a7746749b0b22116ea6c706'
                    }
                    module_chat: {
                        table: 'sys_app_module'
                        id: '12679cf5c1fc4dc799e12e0670e239b6'
                    }
                    module_configuration: {
                        table: 'sys_app_module'
                        id: 'f12430fc3999413fbe47ab40f93bec9a'
                    }
                    module_conversations: {
                        table: 'sys_app_module'
                        id: '331bc5af6491458fa8ae3091203b3c82'
                    }
                    module_jobs: {
                        table: 'sys_app_module'
                        id: '6ae04fa80fab422788280ffd31ae3a35'
                    }
                    module_properties: {
                        table: 'sys_app_module'
                        id: '8ac6330ad6f84caca5539437fbfca120'
                    }
                    module_tool_builder: {
                        table: 'sys_app_module'
                        id: 'f595b8103d2445069c88f2955a325d5a'
                    }
                    module_tools: {
                        table: 'sys_app_module'
                        id: '7f22ab2f6d3646709654cd2322de34e9'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'c5448691ade642e087583394b2887915'
                    }
                    page_wayfinder_col: {
                        table: 'sp_column'
                        id: 'e734bae53e784e6c9251c02cdaeea17e'
                    }
                    page_wayfinder_container: {
                        table: 'sp_container'
                        id: 'bfd8f19a0388400e8c999b4dad8155f7'
                    }
                    page_wayfinder_instance: {
                        table: 'sp_instance'
                        id: '1a742e9993514a0ca2fdc191170ef271'
                    }
                    page_wayfinder_row: {
                        table: 'sp_row'
                        id: '44968f30f6ae4bcbbcf2094cbe32fa09'
                    }
                    page_wayfinder_tools_col: {
                        table: 'sp_column'
                        id: '767562118b924dc08e94ae626bc49c4a'
                    }
                    page_wayfinder_tools_container: {
                        table: 'sp_container'
                        id: '7f0c54a6644343cab4f92689efec5068'
                    }
                    page_wayfinder_tools_instance: {
                        table: 'sp_instance'
                        id: 'da0688fdc06947e090616e11ff71a021'
                    }
                    page_wayfinder_tools_row: {
                        table: 'sp_row'
                        id: '2ac784e411e247829556df6820a0b6ec'
                    }
                    prop_azure_api_key: {
                        table: 'sys_properties'
                        id: 'db97c383bb80457f8668201d515416db'
                    }
                    prop_azure_api_version: {
                        table: 'sys_properties'
                        id: '11ff608203ba47918e2e65b409c55950'
                    }
                    prop_azure_deployment: {
                        table: 'sys_properties'
                        id: '11b0ae82b1384ababd1f7ecc310ae6b3'
                    }
                    prop_azure_endpoint: {
                        table: 'sys_properties'
                        id: '628cff6192e6497bb476d10908d3800d'
                    }
                    prop_azure_temperature: {
                        table: 'sys_properties'
                        id: '1aa3de26d301471f8b73b43df47179ab'
                    }
                    prop_azure_timeout_ms: {
                        table: 'sys_properties'
                        id: '0538e7f17b0b4c76bb1a2925c4629c37'
                    }
                    prop_bot_api_basic_password: {
                        table: 'sys_properties'
                        id: '5911bf40134d4960b3a9f5a86cb9d956'
                    }
                    prop_bot_api_basic_user: {
                        table: 'sys_properties'
                        id: '6b93262ae09042a3b7557f012291ab1b'
                    }
                    prop_bot_api_live_agent_topic: {
                        table: 'sys_properties'
                        id: '2e3897d2ed604f5fad85b63f7e40391f'
                    }
                    prop_bot_api_timeout_ms: {
                        table: 'sys_properties'
                        id: '393f669e1f9541b7985fcd1152bce1ee'
                    }
                    prop_bot_api_token: {
                        table: 'sys_properties'
                        id: '6850e141448349a49d9e89a8b9ad893a'
                    }
                    prop_portal_suffix: {
                        table: 'sys_properties'
                        id: 'e2171168d41e40a3b16c1769044f6c9c'
                    }
                    prop_system_prompt: {
                        table: 'sys_properties'
                        id: '3969073df1c14ed18ab8f2461abe3655'
                    }
                    prop_use_bot_api: {
                        table: 'sys_properties'
                        id: '3f5d978d07bf4654b827e8ee82c02663'
                    }
                    prop_va_inbound_secret: {
                        table: 'sys_properties'
                        id: '5477e96c075f42c29fa834218364bed2'
                    }
                    rest_wayfinder: {
                        table: 'sys_ws_definition'
                        id: '74f53be567c342d7a4e7336593f15240'
                    }
                    rest_wayfinder_va_inbound: {
                        table: 'sys_ws_operation'
                        id: '33d9255faab544b3a6679bc2c820140d'
                    }
                    rest_wayfinder_va_inbound_secret: {
                        table: 'sys_ws_header'
                        id: 'a366895f40694d0ab5755e6ae8f61888'
                    }
                    si_wayfinder_agent: {
                        table: 'sys_script_include'
                        id: 'c0de5c26b2c243dd9414f8b3c06e9b07'
                    }
                    si_wayfinder_azure_client: {
                        table: 'sys_script_include'
                        id: '9b1129be7e2d40e6be52de1251f1fcec'
                    }
                    si_wayfinder_bot_api_client: {
                        table: 'sys_script_include'
                        id: '1d96c4b02d90463189300e9a8703ace1'
                    }
                    si_wayfinder_store: {
                        table: 'sys_script_include'
                        id: '3b0a7939037446cb9ada56d703203a76'
                    }
                    si_wayfinder_tools: {
                        table: 'sys_script_include'
                        id: '40d22653f7ee4b1b84364a0565128609'
                    }
                    tool_escalate_to_agent: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: '692db725ca904a15929c4aff817f294d'
                    }
                    tool_get_catalog_item: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: 'e0a33df96294482c9dc0ed4936294c7e'
                    }
                    tool_get_task: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: '82c4327685424ce19702be333812aaac'
                    }
                    tool_search_catalog: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: 'df904fb774ae45b3b647e5b74a26ff4e'
                    }
                    tool_search_knowledge: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: '020baf7b9fd84d27b7c35871c7b991de'
                    }
                    tool_search_tasks: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: 'b8d13f3853594f1ca8e8cc1ea0ac4ea8'
                    }
                    tool_submit_catalog_request: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: '4901d1fc68d342dba85ba587155f1be7'
                    }
                    tool_update_task: {
                        table: 'x_snc_wayfinder_ai_tool'
                        id: '797097e9fc3240a2a97baa05539d07cc'
                    }
                    widget_wayfinder_chat: {
                        table: 'sp_widget'
                        id: 'f0f818ececb24d00a8ce523125f59031'
                    }
                    widget_wayfinder_tool_builder: {
                        table: 'sp_widget'
                        id: '03a83db5188b42389a3c6d1fe1069b39'
                    }
                }
                composite: [
                    {
                        table: 'sys_choice'
                        id: '028cc022624741d38a76175ba8e75d4c'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'awaiting_confirmation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0476f1aabda74b03a6f94e3e89fcc3d2'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'conversation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '063cebb604484fb9992bdc578de52e07'
                        key: {
                            document_key: '4caa5e9d48444f9c9b34421182d96d5e'
                            variable: '989d9e235324220002c6435723dc3484'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '06d78aa276a142579629ec45c5cacb76'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'complete'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '080191a15645472cae9a7eeebf65652f'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0a11a38bb81e4151a3cd0bc4a389535f'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'mode'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0b29668262ad4eb886f4011d51939772'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'role'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0f94a235d06649299ca8637e0539a364'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'mode'
                            value: 'ai'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '109d8d6e75f449fabc1be7cfdfff22e3'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'user_message'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '123dc7dedc6848ad97ba9995f8f118cb'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'role'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1257ee9935f44f3b963429b65a0d3a24'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'tool_call'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1585fd0d2c88459ead0c1aa66a858f91'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'return_fields'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '17c630a4738d43ca809081b4e9acdab5'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'enabled'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '18ece3f494b64b91b2e9cd5da76691ac'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1929937e72334c84999215e223151afc'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'streaming'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1c429a30f611424d977cd2183e264c99'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1cb7976747074173aa89a3952fdd381b'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'encoded_query_template'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '1f03871877b04f62a1608d9777c4c919'
                        key: {
                            document_key: '4caa5e9d48444f9c9b34421182d96d5e'
                            variable: '42f2564b73031300440211d8faf6a777'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '1f794b4d8f9b42b1b213fafdc26a4b22'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2044ab7b3a4d479d83d94783e0610276'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '24a2d15a9a6f486483825bf5736712a6'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'operation'
                            value: 'read'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '28da6178eb424cc59ce24982ed98873b'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'tool_calls'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2c434f5822094c6a884c2c0343c59c8d'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'operation'
                            value: 'update'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2c899a0fb05946db846377f11025a1ba'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'kind'
                            value: 'builtin'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '335e90a7c0bd4eaeabd844bbd220015d'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3378af44f048403db21e9747d9949980'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '33b49db2d6c241be971c6915fbcbc920'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'role'
                            value: 'user'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ws_header_map'
                        id: '3532de6ce56a45648f020e3b1784c51e'
                        key: {
                            web_service_operation: '33d9255faab544b3a6679bc2c820140d'
                            web_service_header: 'a366895f40694d0ab5755e6ae8f61888'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '35628d7a7830428a92ca6f96d5408c01'
                        key: {
                            document_key: '83c1b7ea941b40f1afec7f3f46eab253'
                            variable: 'b27b2b29ff6033008d3f5d9ad53bf164'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '388e2aaa025c453a8c79be777dce4303'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'kind'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '391a5c7340994a1ea8a88c00186bb2e2'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'mode'
                            value: 'agent'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '3f3c078e73dd45b1bc20fd79554207db'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '4078d66e3ce24e0eb2ca3c1457b6b213'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '41c5ddce77ff4043af20ed0a3d8201a2'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'kind'
                            value: 'table'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4579384d4c9a41d09e1127fb5fcd9a38'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'agent_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4593178661ee4b0188a459aa61e29e46'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4a1c7fdc76944444bc815998dfe60a46'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'parameters_json'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4e715f45891e4625a3c27b6dd8248a65'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '546cb29b6bb3463b81ac46e514a1813f'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '560a50685f3148e8868ec265ad9a0be0'
                        key: {
                            document_key: '83c1b7ea941b40f1afec7f3f46eab253'
                            variable: '98c44875ffa033008d3f5d9ad53bf1fa'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '56a769ae75ac4d9c84554ceda15e0c85'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'content'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '57438643ede6423f94d95e0e29c7dfae'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'require_confirmation'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '584853093b0cdf102d67da31a3e45a27'
                        key: {
                            name: 'x_snc_wayfinder_ai.admin'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '595f7cf75df24bf6bbe348a142666860'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'tool_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sp_page'
                        id: '5a5199537ce24e719aa05f074bdcabfe'
                        key: {
                            id: 'wayfinder-tools'
                        }
                    },
                    {
                        table: 'sp_page'
                        id: '5baefa2469194e44934981258e3182c6'
                        key: {
                            id: 'wayfinder'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5dc00502b4e24b6b91925bbdfb977907'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'new'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '621fc55f4b5342f4992f037a045dad27'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'role'
                            value: 'tool'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '648064c9660b447ab45498dd36026d8f'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'seq'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '65c6cc564d954fca8d3058a91f1df17a'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '65cfd380b8de4d6a8d5980c52c49371b'
                        key: {
                            logical_table_name: 'x_snc_wayfinder_ai_tool'
                            col_name_string: 'name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6632468992974491a8ba8f54e6daa159'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'agent_conversation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6767d3346a4b4590a3ec65ff34851b35'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'title'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '694b7038cb6845a4931b7be1fd80dcec'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'tool_call_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6a418e2b5a044e5096323274b075fd0a'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'last_tool'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6a98ef6b0373451c981fb12c1241b720'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '74d5635df89d4fc4aec7c3a663778405'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'operation'
                            value: 'create'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '74f3e9d3cade468db93a0066905c998e'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7606aab116e8485abaf292ed58c1d64e'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'tool_calls'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '79f2ea551afe435d8870959951b614de'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7cdb21fbb60848f2aeed8fb2eab5410e'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'title'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7d5cbd8dd9104662b71119fb512166ab'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'pending_tool_calls'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7dfac8feccd34198b05a9617adea7ed6'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'content'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7f549b15972d4695b6dbe813cfdf5eee'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8333115aaf714adaaf04f3d64e93136f'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'cancelled'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '834368b71b5b45da964b90f571cf94f8'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8d01fba933974a53b47115ea4e8f0e98'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'seq'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '8ec6176a7b094fa0ba37ddb5c7891cbf'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'mode'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9025379b05384e34b2461be3ceda4ecc'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '902f09d7063a4a899c8c2f152262ac43'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'error_message'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '90a3ee113b6649f491af5ef2c0937f8b'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'error'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '91301d4cce0a4965b9fcb7c388a35b8a'
                        key: {
                            logical_table_name: 'x_snc_wayfinder_ai_message'
                            col_name_string: 'conversation,seq'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '933faed4cb7449db82eddaea2e1b3c99'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'pending_tool_calls'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9682777543fd41bdbcbd5543d0953cd5'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'confirmed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '97dff9082f7042a8aad9bbb5f0eb4cad'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'agent_conversation'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9980bb167c0848108a7b2439828b6c0f'
                        key: {
                            sys_security_acl: '38be8f7c13b34967a26f521cd0d788d7'
                            sys_user_role: {
                                id: '584853093b0cdf102d67da31a3e45a27'
                                key: {
                                    name: 'x_snc_wayfinder_ai.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '99a5687a177e4b97998cf749472010f2'
                        key: {
                            sys_security_acl: 'e29500d3c4394f34b064e002526b18f0'
                            sys_user_role: {
                                id: '584853093b0cdf102d67da31a3e45a27'
                                key: {
                                    name: 'x_snc_wayfinder_ai.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9b91c210af9548ddad778cd763f5fa6f'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'max_results'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9cf534ea22bd4050997bb1a07f5d183e'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'target_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: '9f0d29309f2649daa759078293f63bfb'
                        key: {
                            document_key: '83c1b7ea941b40f1afec7f3f46eab253'
                            variable: '1778a7480f20101091d0f00c97767e03'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a65f7974b2a24f7c9e4429bfa609a35e'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'return_fields'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a687127834af46e0b0f1e51ee05fd22a'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'status'
                            value: 'running'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a7b8cfe5c1ef4d2db3e1866c2431ee1c'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'interaction'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'a9b7374feb9a4a3388b6af9aa3a7edff'
                        key: {
                            document_key: '83c1b7ea941b40f1afec7f3f46eab253'
                            variable: 'ff06ab840f20101091d0f00c97767e6d'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'aac4d4e672834daaa96d5ff8c91703fb'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'kind'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ad6c782a500242c5aa2ef74fae01d927'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'content'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'adf9e2dd50394854918b78f9eb6890a7'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'tool_call_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b218495a667745eea59221812d44a502'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'b634e30518d54b6cadb94cc9f3629a28'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b6a7ab477a2a46dfb7059f117a3b7977'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'interaction'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b7b9447f842141b58385601dba6c042e'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'kind'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'b806d38e3c834bf5888ce096b2c0ad6f'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'badd6bc56a634b06b2ee4758ffab9926'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'bbe9b54554194738a3b78008d98b4e86'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'be6d6383944a450798202a9be80e1de1'
                        key: {
                            document_key: '83c1b7ea941b40f1afec7f3f46eab253'
                            variable: '8c07aba5ff6033008d3f5d9ad53bf13b'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bed244a289f6442086434fa7155ebe60'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'conversation'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'bf1fd9a76b4240d0828be0606eee43af'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bfe59265adf54f78a0e870579b08a772'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'last_tool'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c03fbda698b2414095be3cb3ae5f31c0'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'role'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c7e77d5bb271476a9f55fc777739fdf6'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c87e772859f14d5e944ecf3066c6646b'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'require_confirmation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ccb9e9c6dd4248f88aa10e16a0d5292c'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'ce4c6f1d005c4f4f97a172b26c5b5293'
                        key: {
                            document_key: '83c1b7ea941b40f1afec7f3f46eab253'
                            variable: '1985e0ceff2433008d3f5d9ad53bf1ba'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ce785f24a82140be9b2f5e305d55cee2'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'user_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cebdb6d832e94e7aac8bea308b49e289'
                        key: {
                            sys_security_acl: '26b52bb73fe7450db807cb6fe589aa70'
                            sys_user_role: {
                                id: '584853093b0cdf102d67da31a3e45a27'
                                key: {
                                    name: 'x_snc_wayfinder_ai.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_variable_value'
                        id: 'd0752697e8c74a9ba5bdc4aa5acbdbbb'
                        key: {
                            document_key: '83c1b7ea941b40f1afec7f3f46eab253'
                            variable: '6f69fc4aff6433008d3f5d9ad53bf18c'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'd11d8568cf0e46089889896a2ed72269'
                        key: {
                            logical_table_name: 'x_snc_wayfinder_ai_conversation'
                            col_name_string: 'user'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd49d9884a4f540a692b978085b54e9ff'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'conversation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd4c4550ac4c84a7fb92b678fea3d8658'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'parameters_json'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'd604ecc75fcd43d183b111241bd7c320'
                        key: {
                            logical_table_name: 'x_snc_wayfinder_ai_chat_job'
                            col_name_string: 'conversation'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'd6dec4270c384e04be4355d4b3495cdd'
                        key: {
                            logical_table_name: 'x_snc_wayfinder_ai_message'
                            col_name_string: 'conversation,sys_created_on'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'd84853093b0cdf102d67da31a3e45a35'
                        key: {
                            name: 'x_snc_wayfinder_ai.user'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dc9756e5dfb247e28ea48dd74d697fbc'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'enabled'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e322b8f8edbc48a89c0f7ea1824add5b'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'error_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e3b3bc2fad4b4d259c42d220d52a5328'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'conversation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e65d30b5a9ac4ae79b426b913f05b721'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'content'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e868341539134cd7a01749557117944a'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'target_table'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e921c42fb203475aa472a0611c8d2317'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'mode'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ebdd0d7b88464531a4df9b2a42db5670'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'max_results'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eeb37de60b21408c8ecea68f5d98e0c5'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f4aca35630814de4bec893c0cf16962f'
                        key: {
                            name: 'x_snc_wayfinder_ai_tool'
                            element: 'encoded_query_template'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f518b5cf3a354de58fe887b1cc3be1ab'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'tool_name'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fb873342ce4242198f102f8e6486678a'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'agent_name'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fd46098879234bbb8c77910534ef3ea0'
                        key: {
                            name: 'x_snc_wayfinder_ai_chat_job'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ff0c4c63d1054d1e96488e729a8db778'
                        key: {
                            name: 'x_snc_wayfinder_ai_conversation'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ff7bf53948c346759f5f4dd8b6ecb829'
                        key: {
                            name: 'x_snc_wayfinder_ai_message'
                            element: 'role'
                            value: 'assistant'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                ]
            }
        }
    }
}
