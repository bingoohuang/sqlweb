(function () {
    $.createLinkToTableContextMenu = function (contextMenuHolder, classifier, tid, tname) {
        $.each(contextMenuHolder.allColumnNames, function (key, value) {
            createLinkToTableColumnContextMenu(classifier, tid, tname, contextMenuHolder.queryResultId, contextMenuHolder.tableName, key, contextMenuHolder.columnNames)
        })
    }

    function copiedTips(tipsContent) {
        $('#tipsDiv').html(tipsContent).show()
        setTimeout(function () {
            $('#tipsDiv').hide()
        }, 3000)
    }

    var createColumnsValue = function (queryResultId, columnName) {
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
                            inPart += '\n'
                        }

                        inPart += val
                        duplicate[val] = true
                    }
                }
            })

        return inPart
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


    var linkTo = function (classifier, tid, tname, queryResultId, columnName, key, linkedToTables, cell) {
        var linkedTableName = key.substring(4)
        var linkedField = linkedToTables[linkedTableName]

        var sql = "select * from " + linkedTableName + " where " + linkedField + (cell.hasClass('headCell')
            ? " in (" + createInPart(queryResultId, columnName) + ")"
            : " = '" + cell.text() + "'")

        $.executeQueryAjax(classifier, tid, tname, sql)
    }

    function processCopyWhere(columnName, cellValue) {
        $.copyTextToClipboard(' where ' + columnName + " = '" + cellValue + "'")
    }


    var createLinkToTableColumnContextMenu = function (classifier, tid, tname, queryResultId, tableName, columnName, linkColumnNames) {
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
                        linkTo(classifier, tid, tname, queryResultId, columnName, key, linkedToTables, $(this))
                    } else if (key === 'Copy Where') {
                        processCopyWhere(columnName, $(this).text())
                        copiedTips('Where clause copied.')
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
                    linkTo(classifier, tid, tname, queryResultId, columnName, key, linkedToTables, $(this))
                } else if (key === 'sqlInPart') {
                    var inPart = columnName + " in (" + createInPart(queryResultId, columnName) + ")"
                    $.copyTextToClipboard(inPart)
                    copiedTips('In clause copied.')
                } else if (key === 'copyColumns') {
                    var columnsValue = createColumnsValue(queryResultId, columnName)
                    $.copyTextToClipboard(columnsValue)
                    copiedTips('Column values copied.')
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

    $.createTableToolsContextMenu = function (classifier, tid, tname, result, resultId) {
        if (result.TableName === '') return

        var selectSql = $.createSelectSql(result)
        var insertSqlPrefix = $.createInsertSqlPrefix(result)
        $.contextMenu({
            selector: '#tableTools' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                if (key === 'CreateSelectSQL') {
                    $.appendSqlToSqlEditor(selectSql, true)
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
                    $.executeQueryAjax(classifier, tid, tname, 'show full columns from ' + result.TableName)
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
                    $.appendSqlToSqlEditor(javabean, true, true
                    )
                }
            },
            items: {
                CreateInsertSQLsHighlighted: {name: "Create Insert SQLs for Highlighted", icon: "columns"},
                CreateInsertSQLsAll: {name: "Create Insert SQLs for All", icon: "columns"},
                CreateSelectSQL: {name: "Create Select SQL", icon: "columns"},
                CreateDeleteSQLs: {name: "Create Delete SQLs for Highlighted", icon: "columns"},
                ShowEqlTemplates: {name: 'Show Eql Templates', icon: 'columns'},
                CreateJavaBean: {name: 'Create JavaBean', icon: 'columns'},
                ShowFullColumns: {name: 'Show Columns', icon: 'columns'},
                ShowCreateTable: {name: 'Show Create Table', icon: 'create-table'}
            }
        });

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