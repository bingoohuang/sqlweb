(function(){
    $.showCreateTableAjax = function (tableName) {
        $.ajax({
            type: 'POST',
            url: pathname + "/query",
            data: { tid: activeMerchantId, sql: 'show create table ' + tableName},
            success: function (content, textStatus, request) {
                var createTableSql = content.Rows[0][2]
                var formattedSql = sqlFormatter.format(createTableSql, { language: 'sql' })
                $.sqlCodeMirror.setValue(formattedSql)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
        $('.tablesWrapper').hide()
    }

})()