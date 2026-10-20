import '@servicenow/sdk/global'
import { Test } from '@servicenow/sdk/core'

// Security acceptance test: ACLs hold inside the tool layer.
// Run it from Automated Test Framework > Tests on a sub-production instance.
// ATF rolls back the user it creates; the script deletes its own probe incident.
Test(
    {
        $id: Now.ID['atf_wayfinder_tools_respect_acls'],
        name: 'Wayfinder - tools respect ACLs and block query injection',
        description:
            'Creates a user with no roles, impersonates them, and checks that get_task and a table read tool cannot see an incident the user is not allowed to read, that model-supplied values cannot add query clauses, and that write tools require approval.',
        active: true,
    },
    (atf) => {
        atf.server.createUser({
            $id: Now.ID['atf_wayfinder_create_user'],
            firstName: 'Wayfinder',
            lastName: 'ACL Probe',
            fieldValues: {},
            groups: [],
            roles: [],
            impersonate: true,
        })
        atf.server.runServerSideScript({
            $id: Now.ID['atf_wayfinder_acl_script'],
            script: Now.include('../scripts/atf/tools-respect-acls.js'),
        })
    }
)
