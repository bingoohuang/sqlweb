(function () {
    $.appendSqlToSqlEditor = function (sql) {
        var formattedSql = sqlFormatter.format(sql, {language: 'sql'})
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

    $.showCreateTableAjax = function (tableName) {
        $.ajax({
            type: 'POST',
            url: pathname + "/query",
            data: {tid: activeMerchantId, sql: 'show create table ' + tableName},
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