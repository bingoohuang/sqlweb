(function () {
    $.appendSqlToSqlEditor = function (sql, withoutFormat) {
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
        codeMirror.setValue(newValue + formattedSql + ';')
    }

    $.showSqlAjax = function (sql) {
        $.ajax({
            type: 'POST',
            url: pathname + "/query",
            data: {tid: activeMerchantId, sql: sql},
            success: function (content, textStatus, request) {
                var createTableSql = content.Rows[0][2]
                $.appendSqlToSqlEditor(createTableSql);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
        $('.tablesWrapper').hide()
    }

})()