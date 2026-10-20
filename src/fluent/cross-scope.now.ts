import '@servicenow/sdk/global'
import { CrossScopePrivilege } from '@servicenow/sdk/core'

// Global tables and APIs the built-in tools use. Admin-defined table tools on
// other tables are covered by the app's permissive runtime access tracking.
// Fluent source files cannot contain loops, so each privilege is written out.

CrossScopePrivilege({ $id: Now.ID['csp_task_read'], status: 'allowed', operation: 'read', targetName: 'task', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_task_write'], status: 'allowed', operation: 'write', targetName: 'task', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_kb_knowledge_read'], status: 'allowed', operation: 'read', targetName: 'kb_knowledge', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_sc_cat_item_read'], status: 'allowed', operation: 'read', targetName: 'sc_cat_item', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_item_option_new_read'], status: 'allowed', operation: 'read', targetName: 'item_option_new', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_io_set_item_read'], status: 'allowed', operation: 'read', targetName: 'io_set_item', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_question_choice_read'], status: 'allowed', operation: 'read', targetName: 'question_choice', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_sc_request_read'], status: 'allowed', operation: 'read', targetName: 'sc_request', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_sc_req_item_read'], status: 'allowed', operation: 'read', targetName: 'sc_req_item', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_sys_choice_read'], status: 'allowed', operation: 'read', targetName: 'sys_choice', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_sys_user_read'], status: 'allowed', operation: 'read', targetName: 'sys_user', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_sys_db_object_read'], status: 'allowed', operation: 'read', targetName: 'sys_db_object', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_sys_dictionary_read'], status: 'allowed', operation: 'read', targetName: 'sys_dictionary', targetScope: 'global', targetType: 'sys_db_object' })
CrossScopePrivilege({ $id: Now.ID['csp_cartjs_execute'], status: 'allowed', operation: 'execute', targetName: 'CartJS', targetScope: 'sn_sc', targetType: 'scriptable' })
CrossScopePrivilege({ $id: Now.ID['csp_catitem_execute'], status: 'allowed', operation: 'execute', targetName: 'CatItem', targetScope: 'sn_sc', targetType: 'scriptable' })
