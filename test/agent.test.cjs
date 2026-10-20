const test = require('node:test')
const assert = require('node:assert/strict')
const { loadScriptIncludes } = require('./harness.cjs')

const ctx = loadScriptIncludes(['WayfinderStore', 'WayfinderTools', 'WayfinderAgent'])
const agent = new ctx.WayfinderAgent()
const MAX = ctx.WayfinderAgent.MAX_TOOL_RESULT_CHARS

test('large result arrays are trimmed into a valid JSON envelope', () => {
    const results = []
    for (let i = 0; i < 400; i++) results.push({ sys_id: String(i).padStart(32, '0'), short_description: 'x'.repeat(100) })
    const s = agent.serializeResult({ ok: true, data: { results, count: 400, table: 'task' } })
    assert.ok(s.length <= MAX)
    const parsed = JSON.parse(s)
    assert.equal(parsed.truncated, true)
    assert.equal(parsed.ok, true)
    assert.equal(parsed.data.table, 'task')
    assert.ok(parsed.data.results.length > 0 && parsed.data.results.length < 400)
    assert.equal(parsed.data.returned, parsed.data.results.length)
})

test('large non-array results are cut as a string, still valid JSON', () => {
    const s = agent.serializeResult({ ok: true, data: { blob: '"\\'.repeat(20000) } })
    assert.ok(s.length <= MAX)
    const parsed = JSON.parse(s)
    assert.equal(parsed.truncated, true)
    assert.equal(typeof parsed.data, 'string')
})

test('small results are passed through unchanged', () => {
    assert.equal(agent.serializeResult({ ok: false, error: 'nope' }), '{"ok":false,"error":"nope"}')
})

test('history places tool rows after their parent even when out of order', () => {
    const calls = [
        { id: 'c1', type: 'function', function: { name: 'get_task', arguments: '{}' } },
        { id: 'c2', type: 'function', function: { name: 'search_knowledge', arguments: '{}' } },
    ]
    const rows = [
        { role: 'user', content: 'hi' },
        { role: 'tool', tool_call_id: 'c2', name: 'search_knowledge', content: '{"ok":true}' }, // came back first
        { role: 'assistant', content: '', tool_calls: calls },
        { role: 'assistant', content: 'done' },
    ]
    const msgs = agent.assembleHistory(rows, 'SYS')
    assert.deepEqual(
        Array.from(msgs, (m) => m.role + (m.tool_call_id ? ':' + m.tool_call_id : '')),
        ['system', 'user', 'assistant', 'tool:c1', 'tool:c2', 'assistant']
    )
    assert.equal(msgs[3].content, ctx.WayfinderAgent.MISSING_RESULT, 'missing result is synthesized')
    assert.equal(msgs[4].content, '{"ok":true}')
    assert.equal(msgs[0].content, 'SYS')
})

test('tool arguments that are not JSON become a _parse_error', () => {
    assert.deepEqual({ ...agent.parseArgs('{"a":1}') }, { a: 1 })
    assert.ok(agent.parseArgs('{oops')._parse_error)
    assert.deepEqual({ ...agent.parseArgs('') }, {})
})
