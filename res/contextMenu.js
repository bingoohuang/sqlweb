(function () {
    $.createLinkToTableContextMenu = function (contextMenuHolder) {
        if (!contextMenuHolder.contextMenuRequired) return

        $.each(contextMenuHolder.columnNames, function (key, value) {
            createLinkToTableColumnContextMenu(contextMenuHolder.tableId, contextMenuHolder.tableName, key)
        })
    }

    var createLinkToTableColumnContextMenu = function (tableId, tableName, columnName) {
        var items = {}

        var upperTable = tableName.toUpperCase()
        var upperColumn = columnName.toUpperCase()
        var linkedToTables = $.linksConfig.fields[upperColumn]

        $.each(linkedToTables, function (key, value) {
            var linkedTable = key
            var linkedField = value

            var isTableNameEqual = linkedTable === upperTable
            var isFieldNameEqual = linkedField === upperColumn
            if (isTableNameEqual && isFieldNameEqual) {
                // ignore
            } else {
                items['link' + linkedTable] = {
                    name: '-> ' + linkedTable + (isFieldNameEqual ? '' : '.' + linkedField),
                    icon: 'link'
                }
            }
        })

        $.contextMenu({
            selector: '#' + tableId + ' td.contextMenu-' + columnName,
            callback: function (key, options) {
                var linkedTableName = key.substring(4)
                var linkedField = linkedToTables[linkedTableName]

                var fieldValue = $(this).text()
                var sql = "select * from " + linkedTableName + " where " + linkedField + " = '" + fieldValue + "'"
                $.executeQueryAjax(sql)
            },
            items: items
        })
    }

    $.isInLinkedTable = function (tableName) {
        if (!tableName) return false

        return !!$.linksConfig.tables[tableName.toUpperCase()]
    }

    $.isInLinkedTableField = function (tableName, columnName) {
        if (!columnName) return false

        var fieldMap = $.linksConfig.tables[tableName.toUpperCase()]
        return fieldMap && fieldMap[columnName.toUpperCase()]
    }

})()