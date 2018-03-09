(function () {
    $.createLinkToTableContextMenu = function (contextMenuHolder, tid, tname) {
        $.each(contextMenuHolder.allColumnNames, function (key, value) {
            createLinkToTableColumnContextMenu(tid, tname, contextMenuHolder.queryResultId, contextMenuHolder.tableName, key, contextMenuHolder.columnNames)
        })
    }

    var createInPart = function (queryResultId, columnName) {
        var inPart = ''
        var checkboxEditable = $('#checkboxEditable' + queryResultId).prop('checked')
        var chosenRows = checkboxEditable
            ? $('#queryResult' + queryResultId + ' :checked').parents('tr:visible')
            : $('#queryResult' + queryResultId + ' tr:visible')

        var duplicate = {}
        chosenRows.find('td.' + $.escapeContextMenuCssName(columnName)).each(
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

    var linkTo = function (tid, tname, queryResultId, columnName, key, linkedToTables, cell) {
        var linkedTableName = key.substring(4)
        var linkedField = linkedToTables[linkedTableName]

        var sql = "select * from " + linkedTableName + " where " + linkedField + (cell.hasClass('headCell')
            ? " in (" + createInPart(queryResultId, columnName) + ")"
            : " = '" + cell.text() + "'")

        $.executeQueryAjax(tid, tname, sql)
    }

    var createLinkToTableColumnContextMenu = function (tid, tname, queryResultId, tableName, columnName, linkColumnNames) {
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
                    var itemData = {
                        name: '-> ' + linkedTable + (isFieldNameEqual ? '' : '.' + linkedField),
                        icon: 'link'
                    }
                    itemsData['link' + linkedTable] = itemData
                    itemsHead['link' + linkedTable] = itemData
                }
            })
        }
        itemsData['Copy Where'] = {
            name: 'Copy Where',
            icon: 'link'
        }

        var selector = '#queryResult' + queryResultId + ' td.' + $.escapeContextMenuCssName(columnName)

        itemsHead['sqlInPart'] = {
            name: 'Copy Columns As In Clause',
            icon: 'link'
        }
        itemsHead['orderByAsc'] = {
            name: 'Order By Asc',
            icon: 'link'
        }
        itemsHead['orderByDesc'] = {
            name: 'Order By Desc',
            icon: 'link'
        }

        if (linkColumnNames[columnName]) {
            $.contextMenu({
                selector: selector + '.dataCell',
                callback: function (key, options) {
                    if (key.indexOf('link') == 0) {
                        linkTo(tid, tname, queryResultId, columnName, key, linkedToTables, $(this))
                    } else if (key === 'Copy Where') {
                        $.copyTextToClipboard(' where ' + columnName + " = '" + $(this).text() + "'")
                    }
                },
                items: itemsData
            })
        } else {
            $.contextMenu({
                selector: selector + '.dataCell',
                callback: function (key, options) {
                    if (key === 'Copy Where') {
                        $.copyTextToClipboard(' where ' + columnName + " = '" + $(this).text() + "'")
                    }
                },
                items: itemsData
            })
        }

        var columnIndex = $.findColumnIndex($('#queryResult' + queryResultId), columnName)

        $.contextMenu({
            selector: selector + '.headCell',
            callback: function (key, options) {
                if (key.indexOf('link') == 0) {
                    linkTo(tid, tname, queryResultId, columnName, key, linkedToTables, $(this))
                } else if (key === 'sqlInPart') {
                    var inPart = columnName + " in (" + createInPart(queryResultId, columnName) + ")"
                    $.copyTextToClipboard(inPart)
                } else if (key === 'orderByAsc') {
                    $.sortingTable('queryResult' + queryResultId, columnIndex, true, 1)
                } else if (key === 'orderByDesc') {
                    $.sortingTable('queryResult' + queryResultId, columnIndex, false, 1)
                }
            },
            items: itemsHead
        })
    }


    $.createOrderByContextMenu = function (queryResultId) {
        var itemsHead = {}

        itemsHead['orderByAsc'] = {
            name: 'Order By Asc',
            icon: 'link'
        }
        itemsHead['orderByDesc'] = {
            name: 'Order By Desc',
            icon: 'link'
        }

        $.contextMenu({
            selector: '#queryResult' + queryResultId + ' td.headCell.contextMenu',
            callback: function (key, options) {
                if (key === 'orderByAsc') {
                    var columnIndex = $.findColumnIndex($('#queryResult' + queryResultId), $(this).text().toUpperCase())
                    $.sortingTable('queryResult' + queryResultId, columnIndex, true, 0)
                } else if (key === 'orderByDesc') {
                    var columnIndex = $.findColumnIndex($('#queryResult' + queryResultId), $(this).text().toUpperCase())
                    $.sortingTable('queryResult' + queryResultId, columnIndex, false, 0)
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