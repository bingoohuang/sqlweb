(function () {
    $.createLinkToTableContextMenu = function (contextMenuHolder) {
        $.each(contextMenuHolder.allColumnNames, function (key, value) {
            createLinkToTableColumnContextMenu(contextMenuHolder.queryResultId, contextMenuHolder.tableName, key, contextMenuHolder.columnNames)
        })
    }

    var createInPart = function (queryResultId, columnName) {
        var inPart = ''
        var checkboxEditable = $('#checkboxEditable' + queryResultId).prop('checked')
        var chosenRows = checkboxEditable
            ? $('#queryResult' + queryResultId + ' :checked').parents('tr:visible')
            : $('#queryResult' + queryResultId + ' tr:visible')

        var duplicate = {}
        chosenRows.find('td.contextMenu-' + columnName).each(
            function (index, td) {
                if (checkboxEditable || index > 0 /*ignore head cell*/) {
                    var val = $(td).text()

                    if (val !== '(null)' && !duplicate[val]) {
                        if (inPart != '') {
                            inPart += ','
                        }

                        inPart += "'" + val + "'"
                        duplicate[val] = true
                    }
                }
            })

        return inPart
    }

    var createLinkToTableColumnContextMenu = function (queryResultId, tableName, columnName, linkColumnNames) {
        var itemsHead = {}
        var itemsData = {}

        var upperTable = tableName.toUpperCase()
        var upperColumn = columnName.toUpperCase()

        if (linkColumnNames[columnName]) {
            var linkedToTables = $.linksConfig.fields[upperColumn]
            $.each(linkedToTables, function (key, value) {
                var linkedTable = key
                var linkedField = value

                var isTableNameEqual = linkedTable === upperTable
                var isFieldNameEqual = linkedField === upperColumn
                if (isTableNameEqual && isFieldNameEqual) {
                    // ignore
                } else {
                    itemsData['link' + linkedTable] = {
                        name: '-> ' + linkedTable + (isFieldNameEqual ? '' : '.' + linkedField),
                        icon: 'link'
                    }

                    itemsHead['link' + linkedTable] = itemsData['link' + linkedTable]
                }
            })
        }
        itemsData['Copy Where'] = {
            name: 'Copy Where',
            icon: 'link'
        }

        var selector = '#queryResult' + queryResultId + ' td.contextMenu-' + columnName

        itemsHead['sqlInPart'] = {
            name: 'Copy Columns As In Clause',
            icon: 'link'
        }

        if (linkColumnNames[columnName]) {
            $.contextMenu({
                selector: selector + '.dataCell',
                callback: function (key, options) {
                    if (key.indexOf('link') == 0) {
                        var linkedTableName = key.substring(4)
                        var linkedField = linkedToTables[linkedTableName]

                        var sql = $(this).hasClass('headCell')
                            ? "select * from " + linkedTableName + " where " + linkedField + " in (" + createInPart(queryResultId, columnName) + ")"
                            : "select * from " + linkedTableName + " where " + linkedField + " = '" + $(this).text() + "'"

                        $.executeQueryAjax(sql)
                    } else if (key === 'Copy Where') {
                        var where = columnName + " = '" + $(this).text() + "'"
                        $.copyTextToClipboard(where)
                    }
                },
                items: itemsData
            })
        } else {
            $.contextMenu({
                selector: selector + '.dataCell',
                callback: function (key, options) {
                    if (key === 'Copy Where') {
                        var where = columnName + " = '" + $(this).text() + "'"
                        $.copyTextToClipboard(where)
                    }
                },
                items: itemsData
            })
        }

        $.contextMenu({
            selector: selector + '.headCell',
            callback: function (key, options) {
                if (key.indexOf('link') == 0) {
                    var linkedTableName = key.substring(4)
                    var linkedField = linkedToTables[linkedTableName]

                    var sql = $(this).hasClass('headCell')
                        ? "select * from " + linkedTableName + " where " + linkedField + " in (" + createInPart(queryResultId, columnName) + ")"
                        : "select * from " + linkedTableName + " where " + linkedField + " = '" + $(this).text() + "'"

                    $.executeQueryAjax(sql)
                } else if (key === 'sqlInPart') {
                    var inPart = columnName + " in (" + createInPart(queryResultId, columnName) + ")"
                    $.copyTextToClipboard(inPart)
                }
            },
            items: itemsHead
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