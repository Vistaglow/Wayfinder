// Loads the ES5 script includes and widget client scripts into a Node vm with
// minimal Glide fakes, so pure logic (query building, sanitizing, history,
// truncation, linkify) can be tested offline. Nothing here talks to an instance.
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.join(__dirname, '..', 'src')

function fakeGs(overrides) {
    const logs = []
    return Object.assign(
        {
            logs,
            getProperty: (name, dflt) => (dflt === undefined ? '' : dflt),
            getUserID: () => 'u1',
            getUserName: () => 'tester',
            info: (m) => logs.push(['info', m]),
            warn: (m) => logs.push(['warn', m]),
            error: (m) => logs.push(['error', m]),
            debug: () => {},
        },
        overrides || {}
    )
}

function loadScriptIncludes(names, gsOverrides) {
    const ctx = {
        Class: {
            create: () =>
                function () {
                    if (this.initialize) this.initialize.apply(this, arguments)
                },
        },
        gs: fakeGs(gsOverrides),
        GlideDateTime: function () {
            this.getNumericValue = () => Date.now()
        },
    }
    vm.createContext(ctx)
    ctx.x_snc_wayfinder_ai = {}
    for (const name of names) {
        const file = path.join(ROOT, 'scripts', 'script-includes', name + '.js')
        vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file })
        ctx.x_snc_wayfinder_ai[name] = ctx[name]
    }
    return ctx
}

function loadController(widget, injected) {
    const file = path.join(ROOT, 'widgets', widget, 'client.js')
    const ctx = { api: {} }
    vm.createContext(ctx)
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file })
    const c = { data: {}, server: { get: () => ({ then: () => {} }) } }
    ctx.api.controller.apply(c, injected)
    return c
}

module.exports = { loadScriptIncludes, loadController, fakeGs }
