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

    $('.executeQuery').prop("disabled", true).click(function () {
        var sql = codeMirror.somethingSelected() ? codeMirror.getSelection() : codeMirror.getValue()
        $.executeQueryAjax(sql)
    })

})()