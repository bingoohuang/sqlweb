(function () {
    var mac = CodeMirror.keyMap.default == CodeMirror.keyMap.macDefault // 判断是否为Mac
    var runKey = (mac ? "Cmd" : "Ctrl") + "-Enter"
    var extraKeys = {}
    extraKeys[runKey] = function (cm) {
        var executeQuery = $('.executeQuery')
        if (!executeQuery.prop("disabled")) executeQuery.click()
    }

    var codeMirror = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: 'text/x-mysql',
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets: true,
        extraKeys: extraKeys
    })

    $.sqlCodeMirror = codeMirror

    $.contextMenu({
        selector: '#sqlwebDiv .CodeMirror',
        zIndex: 10,
        callback: function (key, options) {
            if (key === 'FormatSql') {
                var selected = codeMirror.somethingSelected();
                var sql = selected ? codeMirror.getSelection() : codeMirror.getValue()
                var formattedSql = sqlFormatter.format(sql, {language: 'sql'})

                if (selected) {
                    codeMirror.replaceSelection(formattedSql)
                } else {
                    codeMirror.setValue(formattedSql)
                }
            } else if (key === 'ClearSql') {
                codeMirror.setValue('')
            } else if (key === 'RunSql') {
                if ($('.executeQuery').prop('disabled') === false) {
                    $('.executeQuery').click()
                }
            } else if (key === 'ShowFullColumns') {
                var selected = codeMirror.somethingSelected();

                var tableName = ''
                if (selected) {
                    tableName = codeMirror.getSelection()
                } else {
                    var word = codeMirror.findWordAt(codeMirror.getCursor());
                    tableName = codeMirror.getRange(word.anchor, word.head);
                }
                $.executeQueryAjax('show full columns from ' + tableName)
            }
        },
        items: {
            RunSql: {name: 'Run SQL', icon: 'run'},
            FormatSql: {name: 'Format SQL', icon: 'format'},
            ClearSql: {name: 'Clear SQL', icon: 'clear'},
            ShowFullColumns: {name: 'Show Columns', icon: 'columns'},
        }
    })

    function tryAddSql(sqls, sql) {
        var trimSql = sql.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
        if (trimSql !== '') {
            sqls.push(trimSql)
        }
    }

    function splitSqls(sqlsString, separateChar) {
        var sqls = []

        var inQuoted = false
        var pos = 0
        var len = sqlsString.length
        for (var i = 0; i < len; ++i) {
            var ch = sqlsString[i]
            if (ch === '\\') {
                ++i
            } else if (ch == '\'') {
                if (inQuoted && i + 1 < len && sqlsString[i + 1] === '\'') {
                    ++i; // jump espace for literal apostrophe, or single quote
                } else {
                    inQuoted = !inQuoted
                }
            } else if (!inQuoted && ch === separateChar) {
                tryAddSql(sqls, sqlsString.substring(pos, i))
                pos = i + 1
            }
        }

        if (pos < len) {
            tryAddSql(sqls, sqlsString.substring(pos))
        }
        return sqls
    }

    $('.executeQuery').prop("disabled", true).click(function () {
        var sql = codeMirror.somethingSelected() ? codeMirror.getSelection() : codeMirror.getValue()
        var sqls = splitSqls(sql, ';')

        $.executeQueryAjax(sql, null, sqls, 0)
    })
})()