const test = require('node:test')
const assert = require('node:assert/strict')
const { loadController } = require('./harness.cjs')

const $sce = { trustAsHtml: (s) => s }
const $timeout = Object.assign((fn) => ({ fn }), { cancel: () => {} })
const $scope = { $on: () => {} }
const c = loadController('wayfinder-chat', [$scope, $sce, $timeout, {}])

test('quotes cannot break out of an href', () => {
    const html = c.linkifyHtml('[x](/a"onmouseover="alert(1))')
    // The only raw double quotes are the href delimiters and the target/rel values.
    assert.equal((html.match(/"/g) || []).length, 6, html)
    assert.ok(!/\sonmouseover=/.test(html), html)
})

test('HTML in messages is escaped', () => {
    assert.equal(c.linkifyHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;')
    assert.equal(c.linkifyHtml("it's"), 'it&#39;s')
})

test('markdown links, bare URLs and task numbers become links', () => {
    assert.equal(
        c.linkifyHtml('[KB0010001](/kb_view.do?sys_kb_id=abc)'),
        '<a href="/kb_view.do?sys_kb_id=abc" target="_blank" rel="noopener noreferrer">KB0010001</a>'
    )
    assert.equal(
        c.linkifyHtml('See https://example.com/a.'),
        'See <a href="https://example.com/a" target="_blank" rel="noopener noreferrer">https://example.com/a</a>.'
    )
    assert.equal(
        c.linkifyHtml('Status of INC0010001?'),
        'Status of <a href="/incident_list.do?sysparm_query=number%3DINC0010001" target="_blank" rel="noopener noreferrer">INC0010001</a>?'
    )
    assert.match(c.linkifyHtml('CTASK0010001'), /change_task_list/)
})

test('unknown prefixes, script URLs and protocol-relative links stay text', () => {
    assert.equal(c.linkifyHtml('ABC0010001'), 'ABC0010001')
    assert.equal(c.linkifyHtml('[x](javascript:alert(1))'), '[x](javascript:alert(1))')
    assert.ok(!c.linkifyHtml('[x](//evil.example)').includes('<a'))
})

test('a task number inside a link label does not nest anchors', () => {
    const html = c.linkifyHtml('[INC0010001](/incident.do?sys_id=1)')
    assert.equal((html.match(/<a /g) || []).length, 1)
})

test('busy text names the running tool', () => {
    c.status = 'tool_call'
    c.lastTool = 'get_task'
    assert.equal(c.busyText(), 'Calling get_task…')
    c.status = 'running'
    assert.equal(c.busyText(), 'Thinking…')
})

test('agent banner text follows the wait time', () => {
    c.agentStatus = { queued: true, age_seconds: 5 }
    assert.equal(c.agentStatusText(), 'Waiting for an agent to pick up…')
    c.agentStatus = { queued: true, age_seconds: 60 }
    assert.match(c.agentStatusText(), /Still waiting/)
    c.agentStatus = { queued: true, age_seconds: 200 }
    assert.match(c.agentStatusText(), /No agent has picked up in 200s/)
    c.agentStatus = { accepted: true, agent_name: 'Sam' }
    assert.equal(c.agentStatusText(), 'Connected with Sam')
})
