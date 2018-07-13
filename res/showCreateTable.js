(function () {
    $.appendSqlToSqlEditor = function (sql, withoutFormat, withoutLastComma) {
        var formattedSql = !withoutFormat ? sqlFormatter.format(sql, {language: 'sql'}) : sql
        var codeMirror = $.sqlCodeMirror
        var value = $.trim(codeMirror.getValue())
        var newValue = ''
        if (value !== '') {
            if (value.substring(value.length - 1) === ';') {
                newValue = value + '\n\n'
            } else {
                newValue = value + ';\n\n'
            }

        }
        codeMirror.setValue(newValue + formattedSql + (!withoutLastComma ? ';' : ''))
    }

    $.showSqlAjax = function (sql) {
        $.ajax({
            type: 'POST',
            url: contextPath + "/query",
            data: {tid: activeMerchantId, sql: sql},
            success: function (content, textStatus, request) {
                if (content && content.Error) {
                    $.alertMe(content.Error)
                    return
                }

                var createTableSql = content.Rows[0][2]
                $.appendSqlToSqlEditor(createTableSql)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
        $('.tablesWrapper').hide()
    }

})()