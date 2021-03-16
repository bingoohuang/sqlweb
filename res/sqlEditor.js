(function () {
    const mac = CodeMirror.keyMap.default === CodeMirror.keyMap.macDefault; // 判断是否为Mac

    const runKey = (mac ? "Cmd" : "Ctrl") + "-Enter";
    const extraKeys = {};
    extraKeys[runKey] = function (cm) {
        const executeQuery = $('.executeQuery');
        if (!executeQuery.prop("disabled")) executeQuery.click()
    }

    var codeMirror = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: 'text/x-mysql',
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets: true,
        extraKeys: extraKeys,
        hint: CodeMirror.hint.sql
    })

    $.sqlCodeMirror = codeMirror

    $.getEditorText = function () {
        const selected = codeMirror.somethingSelected();
        return selected ? codeMirror.getSelection() : codeMirror.getValue()
    }

    $.contextMenu({
        selector: '#sqlwebDiv .CodeMirror',
        zIndex: 10,
        callback: function (key, options) {
            const selected = codeMirror.somethingSelected();
            if (key === 'FormatSql') {
                const sql = $.getEditorText();
                const formattedSql = sqlFormatter.format(sql, {language: 'sql'});

                if (selected) {
                    codeMirror.replaceSelection(formattedSql)
                } else {
                    codeMirror.setValue(formattedSql)
                }
            } else if (key === 'ClearSql') {
                codeMirror.setValue('')
            } else if (key === 'RunSql') {
                const $executeQuery = $('.executeQuery');
                if ($executeQuery.prop('disabled') === false) {
                    $executeQuery.click()
                }
            } else if (key === 'ShowFullColumns') {
                let tableName;
                if (selected) {
                    tableName = codeMirror.getSelection()
                } else {
                    const word = codeMirror.findWordAt(codeMirror.getCursor());
                    tableName = codeMirror.getRange(word.anchor, word.head)
                }
                $.executeQueryAjax(activeClassifier, activeMerchantId, activeMerchantCode, activeMerchantName,
                    'show full columns from ' + tableName)
            } else if (key === 'ParseTemplate') {
                const query = $.getEditorText();
                $.templateSql(query)
            }
        },
        items: {
            RunSql: {name: 'Run SQL', icon: 'run'},
            FormatSql: {name: 'Format SQL', icon: 'format'},
            ClearSql: {name: 'Clear SQL', icon: 'clear'},
            ShowFullColumns: {name: 'Show Columns', icon: 'columns'},
            ParseTemplate: {name: 'Parse Template', icon: 'columns'},
        }
    })

    $.getEditorSql = function () {
        return $.getEditorText()
    }

    $('.executeQuery').prop("disabled", true).click(function () {
        const sql = $.getEditorSql();
        if ($.trim(sql) === '') {
            $.alertMe("Please input sql!")
            return
        }

        $.executeMultiSqlsAjaxOptions({
            sql: sql,
            confirmUpdate: false,
            callback: function () {
                $('#refreshTables').click()
            }
        })
    })
})()