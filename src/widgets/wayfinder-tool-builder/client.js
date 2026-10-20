api.controller = function ($scope, $timeout, $window) {
    var c = this;

    c.isAdmin = !!c.data.is_admin;
    c.tools = c.data.tools || [];
    c.popularTables = c.data.popular_tables || [];
    c.view = 'list';
    c.draft = null;
    c.error = '';
    c.notice = '';
    c.saving = false;
    c.testing = false;
    c.testArgs = {};
    c.testResult = null;
    c.tableQuery = '';
    c.tableResults = [];
    c.fields = [];
    c.fieldsLoading = false;
    c.fieldFilter = '';
    c.paramQuery = '';
    c.paramMenuOpen = false;

    c.paramTypes = [
        { value: 'string', label: 'Text' },
        { value: 'integer', label: 'Number' },
        { value: 'boolean', label: 'True / false' },
        { value: 'object', label: 'Object (JSON)' },
    ];

    function call(action, params) {
        params = params || {};
        params.action = action;
        return c.server.get(params).then(function (r) {
            return (r && r.data) || {};
        });
    }

    function networkError() {
        c.error = 'Could not reach the server. Try again.';
    }

    // ---- list ---------------------------------------------------------------

    c.newTool = function () {
        c.error = '';
        c.notice = '';
        c.draft = {
            sys_id: '',
            name: '',
            description: '',
            enabled: true,
            kind: 'table',
            operation: 'read',
            target_table: '',
            parameters: [],
            fields: ['sys_id', 'number', 'short_description'],
            encoded_query_template: '',
            limit: 10,
            require_confirmation: false,
        };
        c.fields = [];
        resetTest();
        c.view = 'form';
    };

    c.editTool = function (id) {
        c.error = '';
        c.notice = '';
        call('get_tool', { sys_id: id }).then(function (d) {
            if (!d.ok) {
                c.error = d.error;
                return;
            }
            c.draft = d.tool;
            if (d.tool.parameters_error) c.error = 'This tool\'s saved parameters were not valid JSON; they were reset. Check them before saving.';
            resetTest();
            c.view = 'form';
            if (c.draft.kind === 'table' && c.draft.target_table) loadFields(c.draft.target_table);
        }, networkError);
    };

    c.deleteTool = function (t) {
        if (!c.isAdmin) return;
        if (!$window.confirm('Delete the tool "' + t.name + '"? The AI stops using it immediately. This cannot be undone.')) return;
        call('delete_tool', { sys_id: t.sys_id }).then(function (d) {
            if (!d.ok) {
                c.error = d.error;
                return;
            }
            c.tools = d.tools;
            c.notice = 'Deleted ' + t.name + '.';
        }, networkError);
    };

    c.backToList = function () {
        c.view = 'list';
        c.draft = null;
        c.error = '';
    };

    // ---- step 2: operation ----------------------------------------------------

    c.setOperation = function (op) {
        var d = c.draft;
        var had = d.operation;
        d.operation = op;
        var idx = paramIndex('sys_id');
        if (op === 'update' && idx === -1) {
            d.parameters.unshift({ name: 'sys_id', type: 'string', description: 'The 32-character sys_id of the record to update.', required: true });
        }
        if (op === 'create' && idx !== -1) d.parameters.splice(idx, 1);
        if (had === 'read' && op !== 'read') d.encoded_query_template = '';
    };

    function paramIndex(name) {
        for (var i = 0; i < c.draft.parameters.length; i++) if (c.draft.parameters[i].name === name) return i;
        return -1;
    }

    // ---- step 3: table ----------------------------------------------------------

    c.searchTables = function () {
        var q = (c.tableQuery || '').trim();
        if (q.length < 2) {
            c.tableResults = [];
            return;
        }
        call('list_tables', { query: q }).then(function (d) {
            if (q === (c.tableQuery || '').trim()) c.tableResults = d.tables || [];
        });
    };

    c.pickTable = function (name) {
        c.draft.target_table = name;
        c.tableQuery = '';
        c.tableResults = [];
        loadFields(name);
    };

    c.changeTable = function () {
        c.draft.target_table = '';
        c.fields = [];
    };

    function loadFields(table) {
        c.fieldsLoading = true;
        call('list_fields', { table: table }).then(function (d) {
            c.fieldsLoading = false;
            if (!d.ok) {
                c.error = d.error;
                c.fields = [];
                return;
            }
            c.fields = d.fields || [];
        }, function () {
            c.fieldsLoading = false;
            networkError();
        });
    }

    function fieldByElement(el) {
        for (var i = 0; i < c.fields.length; i++) if (c.fields[i].element === el) return c.fields[i];
        return null;
    }

    // ---- step 4: parameters -----------------------------------------------------

    c.addParam = function () {
        c.draft.parameters.push({ name: '', type: 'string', description: '', required: false });
    };

    c.removeParam = function (i) {
        c.draft.parameters.splice(i, 1);
    };

    c.paramMatches = function () {
        var q = (c.paramQuery || '').toLowerCase();
        var out = [];
        for (var i = 0; i < c.fields.length && out.length < 10; i++) {
            var f = c.fields[i];
            if (paramIndex(f.element) !== -1) continue;
            if (!q || f.label.toLowerCase().indexOf(q) !== -1 || f.element.toLowerCase().indexOf(q) !== -1) out.push(f);
        }
        return out;
    };

    function paramTypeFor(internalType) {
        if (/^(integer|longint)$/.test(internalType)) return 'integer';
        if (/^(decimal|float|currency|price)$/.test(internalType)) return 'integer';
        if (internalType === 'boolean') return 'boolean';
        return 'string';
    }

    function hintFor(f) {
        if (f.reference) return 'pass the 32-char sys_id of a ' + f.reference;
        if (f.type === 'glide_date') return f.label + ' as YYYY-MM-DD';
        if (f.type === 'glide_date_time') return f.label + ' as YYYY-MM-DD HH:MM:SS';
        if (f.type === 'boolean') return f.label + ' (true or false)';
        return f.label;
    }

    c.addParamFromField = function (f) {
        c.draft.parameters.push({ name: f.element, type: paramTypeFor(f.type), description: hintFor(f), required: false });
        c.paramQuery = '';
        c.paramMenuOpen = false;
    };

    c.openParamMenu = function () {
        c.paramMenuOpen = true;
    };

    // Delay so a click (ng-mousedown) on an option lands before the menu closes.
    c.closeParamMenu = function () {
        $timeout(function () {
            c.paramMenuOpen = false;
        }, 200);
    };

    // ---- step 5: fields returned ---------------------------------------------------

    c.isFieldSelected = function (el) {
        return c.draft.fields.indexOf(el) !== -1;
    };

    c.toggleField = function (el) {
        var i = c.draft.fields.indexOf(el);
        if (i === -1) c.draft.fields.push(el);
        else c.draft.fields.splice(i, 1);
    };

    // Selected fields stay visible while filtering.
    c.visibleFields = function () {
        var q = (c.fieldFilter || '').toLowerCase();
        var out = [];
        for (var i = 0; i < c.fields.length; i++) {
            var f = c.fields[i];
            if (!q || c.isFieldSelected(f.element) || f.label.toLowerCase().indexOf(q) !== -1 || f.element.toLowerCase().indexOf(q) !== -1) out.push(f);
        }
        return out;
    };

    // ---- step 6: filter -------------------------------------------------------------

    c.autoGenerate = function () {
        var clauses = [];
        if (fieldByElement('active')) clauses.push('active=true');
        var freeForm = [];
        for (var i = 0; i < c.draft.parameters.length; i++) {
            var p = c.draft.parameters[i];
            if (!p.name || p.name === 'limit') continue;
            if (fieldByElement(p.name)) clauses.push(p.name + '={' + p.name + '}');
            else freeForm.push(p);
        }
        if (freeForm.length === 1) {
            var ff = freeForm[0];
            if (ff.raw_query) clauses.push('{' + ff.name + '}');
            else if (fieldByElement('short_description')) clauses.push('short_descriptionLIKE{' + ff.name + '}');
            else if (fieldByElement('name')) clauses.push('nameLIKE{' + ff.name + '}');
            else clauses.push('123TEXTQUERY321={' + ff.name + '}');
        }
        c.draft.encoded_query_template = clauses.join('^');
    };

    // ---- step 8: test ---------------------------------------------------------------

    function resetTest() {
        c.testArgs = {};
        c.testResult = null;
    }

    c.clearTest = function () {
        c.testResult = null;
    };

    function coerce(value, type) {
        if (value === undefined || value === null || value === '') return undefined;
        if (type === 'integer' || type === 'number') {
            var n = Number(value);
            return isNaN(n) ? value : n;
        }
        if (type === 'boolean') return value === true || value === 'true';
        if (type === 'object') {
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        }
        return String(value);
    }

    c.runTest = function () {
        if (!c.isAdmin || c.testing) return;
        var args = {};
        for (var i = 0; i < c.draft.parameters.length; i++) {
            var p = c.draft.parameters[i];
            var v = coerce(c.testArgs[p.name], p.type);
            if (v !== undefined) args[p.name] = v;
        }
        c.testing = true;
        c.error = '';
        call('test_tool', { tool: c.draft, args: args }).then(function (d) {
            c.testing = false;
            if (!d.ok) {
                c.error = d.error;
                return;
            }
            c.testResult = d.result;
        }, function () {
            c.testing = false;
            networkError();
        });
    };

    c.pretty = function (obj) {
        return JSON.stringify(obj, null, 2);
    };

    // ---- save -------------------------------------------------------------------------

    c.save = function () {
        if (!c.isAdmin || c.saving) return;
        c.saving = true;
        c.error = '';
        call('save_tool', { tool: c.draft }).then(function (d) {
            c.saving = false;
            if (!d.ok) {
                c.error = d.error;
                return;
            }
            c.tools = d.tools;
            c.notice = 'Saved ' + c.draft.name + '. The chat uses it from the next message.';
            c.view = 'list';
            c.draft = null;
        }, function () {
            c.saving = false;
            networkError();
        });
    };

    c.isWrite = function () {
        return c.draft && c.draft.kind === 'table' && c.draft.operation !== 'read';
    };
};
