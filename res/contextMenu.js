(function () {
    $.createLinkToTableContextMenu = function (contextMenuHolder, classifier, tid, tcode, tname) {
        $.each(contextMenuHolder.allColumnNames, function (key, value) {
            createLinkToTableColumnContextMenu(classifier, tid, tcode, tname, contextMenuHolder.queryResultId, contextMenuHolder.tableName, key, contextMenuHolder.columnNames)
        })
    }

    $.copiedTips = function (tipsContent) {
        $('#tipsDiv').html(tipsContent).show()
        setTimeout(function () {
            $('#tipsDiv').hide()
        }, 60000)
    }

    $.chosenRows = function (resultId) {
        return $.isCheckboxEditable(resultId)
            ? $('#queryResult' + resultId + ' tbody :checked').parents('tr:visible')
            : $('#queryResult' + resultId + ' tbody tr:visible')
    }

    $.isCheckboxEditable = function (resultId) {
        return $('#checkboxEditable' + resultId).prop('checked')
    }

    var createColumnsValue = function (resultId, columnName) {
        var inPart = ''
        var chosenRows = $.chosenRows(resultId)
        var duplicate = {}
        var cssName = $.escapeContextMenuCssName(columnName)
        chosenRows.find('td.' + cssName).each(
            function (index, td) {
                var val = $(td).text()

                if (val !== '(null)' && !duplicate[val]) {
                    if (inPart != '') {
                        inPart += '\n'
                    }

                    inPart += val
                    duplicate[val] = true
                }
            })

        return inPart
    }

    var createInPart = function (resultId, columnName) {
        var inPart = ''
        var $chosenRows = $.chosenRows(resultId)

        var duplicate = {}
        var cssName = $.escapeContextMenuCssName(columnName)
        $chosenRows.find('td.' + cssName).each(
            function (index, td) {
                var val = $(td).text()

                if (val !== '(null)' && !duplicate[val]) {
                    if (inPart != '') {
                        inPart += ','
                    }

                    inPart += "'" + val + "'"
                    duplicate[val] = true
                }
            })

        return inPart
    }


    var linkTo = function (classifier, tid, tcode, tname, queryResultId, columnName, key, linkedToTables, cell) {
        var linkedTableName = key.substring(4)
        var linkedField = linkedToTables[linkedTableName]

        var sql = "select * from " + linkedTableName + " where " + linkedField + (cell.hasClass('headCell')
            ? " in (" + createInPart(queryResultId, columnName) + ")"
            : " = '" + cell.text() + "'")

        $.executeQueryAjax(classifier, tid, tcode, tname, sql)
    }

    function processCopyWhere(columnName, cellValue) {
        $.copyTextToClipboard(' where ' + columnName + ("(null)" == cellValue ? "is null" : " = '" + $.escapeSqlValue(cellValue) + "'"))
    }


    var createLinkToTableColumnContextMenu = function (classifier, tid, tcode, tname, queryResultId, tableName, columnName, linkColumnNames) {
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
        itemsData['Show Column'] = {
            name: 'Show Column',
            icon: 'link'
        }

        var selector = '#queryResult' + queryResultId + ' td.' + $.escapeContextMenuCssName(columnName)

        itemsHead['sqlInPart'] = {
            name: 'Copy Columns As In Clause To Clipboard',
            icon: 'link'
        }
        itemsHead['copyColumns'] = {
            name: 'Copy Columns Values To Clipboard',
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
                        linkTo(classifier, tid, tcode, tname, queryResultId, columnName, key, linkedToTables, $(this))
                    } else if (key === 'Copy Where') {
                        processCopyWhere(columnName, $(this).text())
                        $.copiedTips('Where clause copied.')
                    } else if (key === 'Show Column') {
                        $.processShowColumn(classifier, tid, tableName, columnName)
                    }
                },
                items: itemsData
            })
        } else {
            $.contextMenu({
                selector: selector + '.dataCell',
                callback: function (key, options) {
                    if (key === 'Copy Where') {
                        processCopyWhere(columnName, $(this).text())
                    } else if (key === 'Show Column') {
                        $.processShowColumn(classifier, tid, tableName, columnName)
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
                    linkTo(classifier, tid, tcode, tname, queryResultId, columnName, key, linkedToTables, $(this))
                } else if (key === 'sqlInPart') {
                    var inPart = columnName + " in (" + createInPart(queryResultId, columnName) + ")"
                    $.copyTextToClipboard(inPart)
                    $.copiedTips('In clause copied.')
                } else if (key === 'copyColumns') {
                    var columnsValue = createColumnsValue(queryResultId, columnName)
                    $.copyTextToClipboard(columnsValue)
                    $.copiedTips('Column values copied.')
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

    $.createTableToolsContextMenu = function (classifier, tid, tcode, tname, result, resultId) {
        if (result.TableName === '') return

        var selectSql = $.createSelectSql(result)
        var insertSqlPrefix = $.createInsertSqlPrefix(result)
        $.contextMenu({
            selector: '#tableTools' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                if (key === 'CreateSelectSQL') {
                    $.appendSqlToSqlEditor(selectSql, true)
                } else if (key === 'CreateSelectSQLHighlighted') {
                    var deleteSqls = $.createSelectSqls(selectSql, result, resultId)
                    if (deleteSqls !== '') {
                        $.appendSqlToSqlEditor(deleteSqls, true)
                    }
                } else if (key === 'CreateInsertSQLsHighlighted') {
                    var values = $.createInsertValuesHighlighted(resultId)
                    if (values !== '') {
                        $.appendSqlToSqlEditor(insertSqlPrefix + '\n' + values, true)
                    }
                } else if (key === 'CreateInsertSQLsAll') {
                    var values = $.createInsertValuesAll(resultId)
                    $.appendSqlToSqlEditor(insertSqlPrefix + '\n' + values, true)
                } else if (key === 'CreateDeleteSQLs') {
                    var deleteSqls = $.createDeleteSqls(result, resultId)
                    if (deleteSqls !== '') {
                        $.appendSqlToSqlEditor(deleteSqls, true)
                    }
                } else if (key === 'ShowFullColumns') {
                    $.executeQueryAjax(classifier, tid, tcode, tname, 'show full columns from ' + result.TableName)
                } else if (key === 'ShowCreateTable') {
                    $.showSqlAjax('show create table ' + result.TableName)
                } else if (key === 'ShowEqlTemplates') {
                    var insertEqlTemplate = $.createInsertEqlTemplate(result)
                    var deleteEqlTemplate = $.createDeleteEqlTemplate(result)
                    var updateEqlTemplate = $.createUpdateEqlTemplate(result)
                    var selectEqlTemplate = $.createSelectEqlTemplate(result)

                    $.appendSqlToSqlEditor(insertEqlTemplate + ';\n\n' + deleteEqlTemplate + ';\n\n'
                        + updateEqlTemplate + ';\n\n' + selectEqlTemplate, true)
                } else if (key === 'CreateJavaBean') {
                    var javabean = $.createJavaBean(result)
                    $.appendSqlToSqlEditor(javabean, true, true)
                }
            },
            items: {
                CreateInsertSQLsHighlighted: {name: "Create Insert SQLs for Highlighted", icon: "columns"},
                CreateInsertSQLsAll: {name: "Create Insert SQLs for All", icon: "columns"},
                CreateSelectSQL: {name: "Create Select SQL", icon: "columns"},
                CreateSelectSQLHighlighted: {name: "Create Select SQL for Highlighted", icon: "columns"},
                CreateDeleteSQLs: {name: "Create Delete SQLs for Highlighted", icon: "columns"},
                ShowEqlTemplates: {name: 'Show Eql Templates', icon: 'columns'},
                CreateJavaBean: {name: 'Create JavaBean', icon: 'columns'},
                ShowFullColumns: {name: 'Show Columns', icon: 'columns'},
                ShowCreateTable: {name: 'Show Create Table', icon: 'create-table'}
            }
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