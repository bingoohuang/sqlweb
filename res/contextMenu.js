(function () {
    $.createLinkToTableContextMenu = function (contextMenuHolder, classifier, tid, tcode, tname) {
        $.each(contextMenuHolder.allColumnNames, function (key, value) {
            createLinkToTableColumnContextMenu(classifier, tid, tcode, tname, contextMenuHolder.queryResultId, contextMenuHolder.tableName, key, contextMenuHolder.columnNames)
        })
    }

    $.copiedTips = function (tipsContent) {
        if ($.isEscapeRequired(tipsContent)) {
            $('#tipsDiv').html('<textarea readonly>' + tipsContent + '</textarea>')
        } else {
            $('#tipsDiv').html(tipsContent)
        }

        $('#tipsDivWrap').show()

        setTimeout(function () {
            $('#tipsDivWrap').hide()
        }, 60000 * 5)
    }

    $('#tipsDivClose').click(function () {
        $('#tipsDivWrap').hide()
    })

    $.chosenRows = function (resultId) {
        return $('#queryResult' + resultId).find('tbody tr.highlight:visible')
    }

    $.chosenRowsHighlightedOrAll = function (resultId) {
        var $table = $('#queryResult' + resultId);
        var rows = $table.find('tbody tr.highlight:visible')
        if (rows.length > 0) return rows

        return  $table.find('tbody tr:visible')
    }

    $.isCheckboxEditable = function (resultId) {
        return $('#checkboxEditable' + resultId).prop('checked')
    }

    var createColumnsValue = function (resultId, columnName) {
        var inPart = ''
        var chosenRows = $.chosenRowsHighlightedOrAll(resultId)
        var cssName = $.escapeContextMenuCssName(columnName)
        chosenRows.find('td.' + cssName).each(
            function (index, td) {
                var val = $(td).text()
                if (val === '(null)') {
                    val = ''
                }

                if (inPart != '') {
                    inPart += '\n'
                }

                inPart += val
            })

        return inPart
    }

    var createInPart = function (resultId, columnName) {
        var inPart = ''
        var $chosenRows = $.chosenRowsHighlightedOrAll(resultId)

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


    var linkTo = function (classifier, tid, tcode, tname, queryResultId, columnName, linkKey, cell) {
        var parts = linkKey.split('#') //  var linkKey = 'link#' + i + "#" + linkedTable + "#" + linkedField;
        var linkedTableName = parts[2]
        var linkedField = parts[3]

        var sql = "select * from " + linkedTableName + " where " + linkedField + (cell.hasClass('headCell')
            ? " in (" + createInPart(queryResultId, columnName) + ")"
            : " = '" + cell.text() + "'")

        $.executeQueryAjax(classifier, tid, tcode, tname, sql)
    }

    function processCopyWhere(columnName, cellValue) {
        $.copyTextToClipboard(' where ' + columnName + ("(null)" == cellValue ? "is null" : " = '" + $.escapeSqlValue(cellValue) + "'"))
    }

    var createContextItems = function (itemsData, itemsHead, relativeFieldGroup, upperTable, upperColumn) {
        for (var i = 0; i + 1 < relativeFieldGroup.length; i += 2) {
            var linkedTable = relativeFieldGroup[i];
            var linkedField = relativeFieldGroup[i + 1];
            if (linkedTable === upperTable && linkedField === upperColumn) continue

            var itemData = {
                name: '-> ' + linkedTable + (linkedField === upperColumn ? '' : '.' + linkedField),
                icon: 'link'
            }
            var linkKey = 'link#' + i + "#" + linkedTable + "#" + linkedField
            itemsData[linkKey] = itemData
            itemsHead[linkKey] = itemData
        }
    }
    var findLinkedTableField = function (relativeFieldGroup, upperTable, upperColumn) {
        for (var i = 0; i + 1 < relativeFieldGroup.length; i += 2) {
            if (relativeFieldGroup[i] === upperTable && relativeFieldGroup[i + 1] === upperColumn) return true
        }

        return false
    }

    var findLinkedTable = function (relativeFieldGroup, upperTable) {
        for (var i = 0; i + 1 < relativeFieldGroup.length; i += 2) {
            if (relativeFieldGroup[i] === upperTable) return true
        }

        return false
    }


    var createLinkToTableColumnContextMenu = function (classifier, tid, tcode, tname, queryResultId, tableName, columnName, linkColumnNames) {
        var itemsHead = {}
        var itemsData = {}

        var upperTable = tableName.toUpperCase()
        var upperColumn = columnName.toUpperCase()

        if (linkColumnNames[columnName]) {
            $.each($.linksConfig, function (index, relativeFieldGroup) {
                if (findLinkedTableField(relativeFieldGroup, upperTable, upperColumn)) {
                    createContextItems(itemsData, itemsHead, relativeFieldGroup, upperTable, upperColumn)
                }
            })
        }
        itemsData['Copy Where'] = {name: 'Copy Where', icon: 'link'}
        itemsData['Show Column'] = {name: 'Show Column', icon: 'link'}

        var selector = '#queryResult' + queryResultId + ' td.' + $.escapeContextMenuCssName(columnName)

        itemsHead['sqlInPart'] = {name: 'Copy Column As In Clause', icon: 'link'}
        itemsHead['copyColumns'] = {name: 'Copy Column Values', icon: 'link'}
        itemsHead['orderByAsc'] = {name: 'Order By Asc Local', icon: 'link'}
        itemsHead['orderByDesc'] = {name: 'Order By Desc Local', icon: 'link'}
        itemsHead['RerunOrderByAsc'] = {name: 'Rerun Order By Asc', icon: 'link'}
        itemsHead['RerunOrderByDesc'] = {name: 'Rerun Order By Desc', icon: 'link'}

        if (linkColumnNames[columnName]) {
            $.contextMenu({
                zIndex: 10,
                selector: selector + '.dataCell',
                callback: function (key, options) {
                    if (key.indexOf('link') == 0) {
                        linkTo(classifier, tid, tcode, tname, queryResultId, columnName, key, $(this))
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
                zIndex: 10,
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
            zIndex: 10,
            selector: selector + '.headCell',
            callback: function (key, options) {
                if (key.indexOf('link') == 0) {
                    linkTo(classifier, tid, tcode, tname, queryResultId, columnName, key, $(this))
                } else if (key === 'sqlInPart') {
                    var inPart = columnName + " in (" + createInPart(queryResultId, columnName) + ")"
                    $.copyTextToClipboard(inPart)
                } else if (key === 'copyColumns') {
                    var columnsValue = createColumnsValue(queryResultId, columnName)
                    $.copyTextToClipboard(columnsValue)
                } else if (key === 'orderByAsc' || key === 'orderByDesc') {
                    $.sortingTable('queryResult' + queryResultId, columnIndex, key === 'orderByAsc', 1)
                } else if (key === 'RerunOrderByAsc' || key === 'RerunOrderByDesc') {
                    var sqlDiv = $('#sqlDiv' + queryResultId)
                    var orderBy = ' order by ' + columnName + (key === 'RerunOrderByAsc' ? ' asc' : ' desc')
                    var upperSql = sqlDiv.text().toUpperCase()
                    var pos = upperSql.indexOf('ORDER BY')
                    if (pos < 0) {
                        sqlDiv.text(sqlDiv.text() + orderBy)
                    } else {
                        sqlDiv.text(sqlDiv.text().substr(0, pos) + orderBy)
                    }
                    $('#reExecuteSql' + queryResultId).click()
                }
            },
            items: itemsHead
        })
    }


    $.createOrderByContextMenu = function (queryResultId) {
        var itemsHead = {}
        itemsHead['orderByAsc'] = {name: 'Order By Asc', icon: 'link'}
        itemsHead['orderByDesc'] = {name: 'Order By Desc', icon: 'link'}

        $.contextMenu({
            zIndex: 10,
            selector: '#queryResult' + queryResultId + ' td.headCell.contextMenu',
            callback: function (key, options) {
                if (key === 'orderByAsc' || key === 'orderByDesc') {
                    var columnIndex = $.findColumnIndex($('#queryResult' + queryResultId), $(this).text().toUpperCase())
                    $.sortingTable('queryResult' + queryResultId, columnIndex, key === 'orderByAsc', 0)
                }
            },
            items: itemsHead
        })
    }

    $.createTableToolsContextMenuInMultiTenantResult = function (resultId) {
        $.contextMenu({
            zIndex: 10,
            selector: '#tableTools' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                if (key === 'CreateInsertSQLsHighlightedColumns') {
                    var $resultTable = $('#queryResult' + resultId)


                    var highlightedColumnIndexes = $.findHighlightedColumnIndexes($resultTable)
                    if (highlightedColumnIndexes.length == 0) {
                        $.alertMe("There is no columns highlighted!")
                        return
                    }

                    var fields = []
                    var $tds = $resultTable.find('thead tr:eq(0) td')
                    for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
                        var value = $tds.eq(highlightedColumnIndexes[i]).text()
                        fields.push($.escapeSqlValue(value))
                    }

                    var values = []
                    $resultTable.find('tbody tr:visible').each(function (rowIndex, tr) {
                        var tds = $(tr).find('td')
                        var line = []
                        for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
                            var index = highlightedColumnIndexes[i]
                            line.push("'" + $.escapeSqlValue(tds.eq(index).text()) + "'")
                        }
                        values.push('(' + line.join(',') + ')')
                    })

                    $.appendSqlToSqlEditor('insert into xxx(' + fields.join(", ") + ") values \n" + values.join(',\n'), true)
                }
            },
            items: {
                CreateInsertSQLsHighlightedColumns: {
                    name: "Create Insert SQLs for Highlighted Columns",
                    icon: "columns"
                }
            }
        })

    }

    $.createTableToolsContextMenu = function (classifier, tid, tcode, tname, result, resultId) {
        var selectSql = $.createSelectSql(result)
        var insertSqlPrefix = $.createInsertSqlPrefix(result)
        $.contextMenu({
            zIndex: 10,
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
                    $.showSqlAjax('show create table ' + result.TableName || 'xxx')
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

        var upperTable = tableName.toUpperCase()

        for (var i = 0; i < $.linksConfig.length; i++) {
            var relativeFieldGroup = $.linksConfig[i]

            if (findLinkedTable(relativeFieldGroup, upperTable)) {
                return true
            }
        }

        return false
    }

    $.isInLinkedTableField = function (tableName, columnName) {
        if (!columnName) return false

        var upperTable = tableName.toUpperCase()
        var upperColumn = columnName.toUpperCase()

        for (var i = 0; i < $.linksConfig.length; i++) {
            var relativeFieldGroup = $.linksConfig[i]

            if (findLinkedTableField(relativeFieldGroup, upperTable, upperColumn)) {
                return true
            }
        }

        return false
    }

})()
