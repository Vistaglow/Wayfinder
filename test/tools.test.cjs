const test = require('node:test')
const assert = require('node:assert/strict')
const { loadScriptIncludes } = require('./harness.cjs')

const ctx = loadScriptIncludes(['WayfinderStore', 'WayfinderTools'])
const tools = new ctx.WayfinderTools()

function cfg(o) {
    return tools.normalizeConfig(o)
}

test('namesearch matches every word regardless of order', () => {
    const out = tools._expandNameSearchDirectives('{namesearch:who:first_name,last_name}', { who: 'John Smith' })
    assert.equal(out, 'first_nameLIKEJohn^ORlast_nameLIKEJohn^first_nameLIKESmith^ORlast_nameLIKESmith')
})

test('namesearch drops 1-char words and collapses when empty', () => {
    assert.equal(tools._expandNameSearchDirectives('{namesearch:who:name}', { who: 'J Smith' }), 'nameLIKESmith')
    assert.equal(tools._expandNameSearchDirectives('{namesearch:who:name}', {}), '')
})

test('model values cannot add encoded-query clauses', () => {
    const c = cfg({ target_table: 'sys_user', encoded_query_template: 'active=true^email={email}', parameters: [{ name: 'email' }] })
    const q = tools.buildQuery(c, { email: 'a@b.com^ORactive=false\n^NQsys_id!=x' }, 'u1').query
    assert.equal(q.split('^').length, 2, 'still exactly two clauses: ' + q)
    assert.ok(!/\^OR|\^NQ/.test(q))
})

test('javascript: is removed from normal parameter values', () => {
    const c = cfg({ encoded_query_template: 'caller_id={who}', parameters: [{ name: 'who' }] })
    assert.equal(tools.buildQuery(c, { who: 'javascript:gs.getSession()' }, 'u1').query, 'caller_id=gs.getSession()')
})

test('clauses whose placeholders are all empty are dropped', () => {
    const c = cfg({ encoded_query_template: 'active=true^assigned_to={assignee}^priority={priority}', parameters: [{ name: 'assignee' }, { name: 'priority' }] })
    assert.equal(tools.buildQuery(c, { priority: 1 }, 'u1').query, 'active=true^priority=1')
    assert.equal(tools.buildQuery(c, {}, 'u1').query, 'active=true')
})

test('user context placeholders resolve to the asking user', () => {
    const c = cfg({ encoded_query_template: 'caller_id={user_sys_id}^ORopened_by=javascript:gs.getUserID()' })
    assert.equal(tools.buildQuery(c, {}, 'abc').query, 'caller_id=abc^ORopened_by=abc')
})

test('raw query params keep ^ but are ANDed and limited to date helpers', () => {
    const c = cfg({ encoded_query_template: 'active=true^{query}', parameters: [{ name: 'query', raw_query: true }] })
    assert.equal(tools.buildQuery(c, { query: 'priority=1^ORpriority=2' }, 'u1').query, 'active=true^priority=1^ORpriority=2')
    assert.equal(tools.buildQuery(c, { query: 'assigned_to=javascript:gs.getUserID()^opened_at>=javascript:gs.daysAgoStart(7)' }, 'me').query,
        'active=true^assigned_to=me^opened_at>=javascript:gs.daysAgoStart(7)')
    assert.ok(tools.buildQuery(c, { query: 'ORactive=false' }, 'u1').error)
    assert.ok(tools.buildQuery(c, { query: '^ORactive=false' }, 'u1').error)
    assert.ok(tools.buildQuery(c, { query: 'priority=1^NQactive=false' }, 'u1').error)
    assert.ok(tools.buildQuery(c, { query: 'sys_id=javascript:new GlideRecord("sys_user").deleteMultiple()' }, 'u1').error)
})

test('encoded query cleanup collapses and trims carets', () => {
    assert.equal(tools._cleanEncodedQuery('^^a=1^^^b=2^'), 'a=1^b=2')
})

test('limit is capped at twice the default', () => {
    const c = cfg({ max_results: 10 })
    assert.equal(tools._effectiveLimit(c, {}), 10)
    assert.equal(tools._effectiveLimit(c, { limit: 15 }), 15)
    assert.equal(tools._effectiveLimit(c, { limit: 500 }), 20)
})

test('task number candidates pad digits and never invent a prefix', () => {
    assert.deepEqual(Array.from(tools._taskNumberCandidates('inc 10001')), ['INC10001', 'INC0010001', 'INC0000010001'])
    assert.deepEqual(Array.from(tools._taskNumberCandidates('10001')), ['10001'])
    assert.deepEqual(Array.from(tools._taskNumberCandidates('')), [])
})

test('catalog query keeps active=true as a trailing AND', () => {
    const q = tools._buildCatalogQuery('new laptop pc')
    assert.ok(q.startsWith('123TEXTQUERY321=new laptop pc^ORnameLIKEnew^ORshort_descriptionLIKEnew'))
    assert.ok(q.endsWith('^active=true'))
    assert.ok(!q.includes('LIKEpc'), 'words under 3 chars are skipped')
})

test('HTML stripping decodes entities once and drops scripts', () => {
    assert.equal(tools._stripHtml('<p>A&nbsp;&amp;&nbsp;B &amp;lt;tag&amp;gt; &#65;</p><script>x()</script>'), 'A & B &lt;tag&gt; A')
})

test('excerpt starts near the first hit and marks truncation', () => {
    const text = 'x'.repeat(1000) + ' reset your password here ' + 'y'.repeat(1000)
    const ex = tools._excerpt('<p>' + text + '</p>', 'password')
    assert.ok(ex.startsWith('…') && ex.endsWith('…'))
    assert.ok(ex.includes('password'))
    assert.ok(ex.length <= 902)
    assert.equal(tools._excerpt('short text', 'zzz'), 'short text')
})

test('config normalization defaults and parse errors', () => {
    const c = cfg({ name: 't', parameters_json: '[{"name":"a","required":"true"}]', return_fields: ' a, b ,a', max_results: '0' })
    assert.deepEqual(Array.from(c.fields), ['a', 'b'])
    assert.equal(c.limit, 10)
    assert.equal(c.params[0].required, true)
    assert.equal(cfg({ parameters_json: 'not json' }).parseError !== '', true)
    assert.deepEqual(Array.from(cfg({}).fields), ['sys_id'])
})

test('function definitions use the OpenAI shape', () => {
    const def = tools.buildDefinition(cfg({ name: 'find_user', description: 'd', parameters: [{ name: 'email', type: 'string', description: 'e', required: true }, { name: 'n', type: 'weird' }] }))
    assert.equal(def.type, 'function')
    assert.equal(def.function.name, 'find_user')
    assert.deepEqual(JSON.parse(JSON.stringify(def.function.parameters)), {
        type: 'object',
        properties: { email: { type: 'string', description: 'e' }, n: { type: 'string', description: '' } },
        required: ['email'],
    })
})

test('write tools only set declared parameters', () => {
    const set = {}
    const fakeGr = {
        isValidField: (f) => ['short_description', 'priority', 'caller_id'].includes(f),
        getElement: () => ({ canWrite: () => true }),
        setValue: (k, v) => (set[k] = v),
    }
    const c = cfg({ name: 'upd', parameters: [{ name: 'sys_id' }, { name: 'short_description' }, { name: 'caller_id' }] })
    const res = tools._collectWrites(c, { sys_id: 'x', short_description: 'hi', priority: '1', approval: 'approved', caller_id: '{user_sys_id}' }, fakeGr, 'me')
    assert.deepEqual(set, { short_description: 'hi', caller_id: 'me' })
    assert.deepEqual(Array.from(res.dropped).sort(), ['approval', 'priority'])
})

test('write tools skip fields the user cannot write', () => {
    const fakeGr = {
        isValidField: () => true,
        getElement: (f) => ({ canWrite: () => f !== 'state' }),
        setValue: () => {},
    }
    const c = cfg({ parameters: [{ name: 'state' }, { name: 'comments' }] })
    const res = tools._collectWrites(c, { state: '6', comments: 'done' }, fakeGr, 'me')
    assert.deepEqual(Array.from(res.set), ['comments'])
    assert.deepEqual(Array.from(res.denied), ['state'])
})

test('missing required parameters are reported, not thrown', () => {
    const c = cfg({ name: 'x', kind: 'builtin', parameters: [{ name: 'q', required: true }] })
    const r = tools.executeConfig(c, {}, {})
    assert.equal(r.ok, false)
    assert.match(r.error, /missing required parameter/)
})

test('catalog variable types map and drop layout/masked types', () => {
    assert.equal(tools._mapVariableType('5'), 'choice')
    assert.equal(tools._mapVariableType(8), 'reference')
    assert.equal(tools._mapVariableType(25), null)
    assert.equal(tools._mapVariableType(11), null)
})
