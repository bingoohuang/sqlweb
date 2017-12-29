(function () {
    function executeSql(sql, resultId) {
        $.ajax({
            type: 'POST',
            url: pathname + "/query",
            data: {tid: activeMerchantId, sql: sql},
            success: function (content, textStatus, request) {
                tableCreate(content, sql, resultId)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
        hideTablesDiv()
    }

    $.executeSql = executeSql

    var queryResultId = 0

    var regex = new RegExp(/[\0\x08\x09\x1a\n\r"'\\\%]/g)
    var escaper = function escaper(char) {
        var m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', "'", '"', "\\", '\\\\', "%"]
        var r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', "''", '""', '\\\\', '\\\\\\\\', '\\%']
        return r[m.indexOf(char)]
    }

    function createInsert(cells, result) {
        var insertSql = 'insert into ' + wrapFieldName(result.TableName) + '('
        for (var i = 0; i < result.Headers.length; ++i) {
            if (i > 0) {
                insertSql += ', '
            }
            insertSql += wrapFieldName(result.Headers[i])
        }
        insertSql += ') values ('

        cells.each(function (jndex, cell) {
            if (jndex > 1) {
                insertSql += ', '
            }
            if (jndex > 0) {
                var newValue = $(cell).text()
                if ("(null)" == newValue) {
                    insertSql += 'null'
                } else {
                    insertSql += '\'' + newValue.replace(regex, escaper) + '\''
                }
            }
        })
        return insertSql + ')'
    }

    function createUpdateSetPart(cells, result, headRow) {
        var updateSql = null
        cells.each(function (jndex, cell) {
            var oldValue = $(this).attr('old')
            if (oldValue) {
                if (updateSql == null) {
                    updateSql = 'update ' + wrapFieldName(result.TableName) + ' set '
                } else {
                    updateSql += ', '
                }
                var fieldName = $(headRow.get(jndex + 1)).text()
                var newValue = $(cell).text()
                if ("(null)" == newValue) {
                    updateSql += wrapFieldName(fieldName) + ' is null'
                } else {
                    updateSql += wrapFieldName(fieldName) + ' = \'' + newValue.replace(regex, escaper) + '\''
                }
            }
        })
        return updateSql
    }

    function wrapFieldName(fieldName) {
        if (fieldName.indexOf('_') >= 0) return fieldName
        else return '`' + fieldName + '`'
    }

    function createWherePart(updateSql, result, headRow, cells) {
        updateSql += ' where '
        if (result.PrimaryKeysIndex.length > 0) {
            for (var i = 0; i < result.PrimaryKeysIndex.length; ++i) {
                var ki = result.PrimaryKeysIndex[i] + 1
                if (i > 0) {
                    updateSql += ' and '
                }
                var pkName = $(headRow.get(ki + 1)).text()
                var $cell = $(cells.get(ki))
                var pkValue = $cell.attr('old') || $cell.text()
                updateSql += wrapFieldName(pkName) + ' = \'' + pkValue.replace(regex, escaper) + '\''
            }
            return updateSql
        } else {
            var wherePart = ''
            cells.each(function (jndex, cell) {
                if (jndex > 0) {
                    var whereValue = $(this).attr('old') || $(cell).text()
                    if (wherePart != '') {
                        wherePart += ' and '
                    }
                    var fieldName = $(headRow.get(jndex + 1)).text()

                    if ("(null)" == whereValue) {
                        wherePart += wrapFieldName(fieldName) + ' is null'
                    } else {
                        wherePart += wrapFieldName(fieldName) + ' = \'' + whereValue.replace(regex, escaper) + '\''
                    }
                }
            })
            if (wherePart != null) {
                updateSql += wherePart
            }
        }

        return updateSql
    }

    function executeUpdate(sqlRowIndices, sqls, $rows) {
        $.ajax({
            type: 'POST',
            url: pathname + "/update",
            data: {tid: activeMerchantId, sqls: sqls},
            success: function (content, textStatus, request) {
                if (!content.Ok) {
                    alert(content.Message)
                    return
                }

                for (var i = 0; i < content.RowsResult.length; ++i) {
                    var rowResult = content.RowsResult[i]
                    if (!rowResult.Ok) {
                        alert(rowResult.Message)
                    } else {
                        var rowIndex = sqlRowIndices[i]
                        var $row = $($rows[rowIndex])

                        $row.find('td.dataCell').each(function (jndex, cell) {
                            $(this).removeAttr('old').removeClass('changedCell')
                        })
                        $row.find('input[type=checkbox]').prop('checked', false)
                        $row.remove('.deletedRow').removeClass('clonedRow')
                    }
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    function attachSaveUpdatesEvent(result) {
        var thisQueryResult = queryResultId
        $('#saveUpdates' + thisQueryResult).click(function () {
            var table = $('#queryResult' + thisQueryResult)
            var headRow = table.find('tr.headRow').first().find('td')

            var sqls = []
            var sqlRowIndices = []
            var $rows = table.find('tr.dataRow')
            $rows.each(function (index, row) {
                var $row = $(row)
                var cells = $row.find('td.dataCell')
                if ($row.hasClass('clonedRow')) {
                    var insertSql = createInsert(cells, result)
                    sqls[sqls.length] = insertSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else if ($row.hasClass('deletedRow')) {
                    var deleteSql = 'delete from ' + result.TableName + ' '
                    deleteSql = createWherePart(deleteSql, result, headRow, cells)
                    sqls[sqls.length] = deleteSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else {
                    var updateSql = createUpdateSetPart(cells, result, headRow)

                    if (updateSql != null) {
                        updateSql = createWherePart(updateSql, result, headRow, cells)
                        sqls[sqls.length] = updateSql
                        sqlRowIndices[sqlRowIndices.length] = index
                    }
                }
            })
            if (sqls.length == 0) {
                alert('There is no changes to save!')
                return
            }

            var joinedSqls = sqls.join(';\n')
            if (confirm(joinedSqls + ';\n\nAre you sure to save ?')) {
                executeUpdate(sqlRowIndices, joinedSqls, $rows)
            }
        })
    }

    function alternateRowsColor() {
        $('#queryResult' + queryResultId + ' tr:even').addClass('rowEven')
    }

    function toggleRowEditable() {
        var rowChecked = $(this).prop('checked')
        var dataCells = $(this).parents('tr').find('td.dataCell')
        if (!rowChecked) {
            dataCells.attr('contenteditable', false)
                .unbind('dblclick').unbind('blur')
            return
        }

        dataCells.dblclick(function () {
            var $this = $(this)
            if (!$this.attr('old')) {
                $this.attr('old', $this.text())
            }
            $this.attr('contenteditable', true)
                .focus()
                .keydown(function (event) {
                    var keyCode = event.keyCode || event.which
                    if (keyCode == 13 && event.ctrlKey) {
                        $this.blur()
                    }
                })
        }).blur(function (event) {
            var $this = $(this)
            $this.attr('contenteditable', false)
            if ($this.attr('old') == $this.text()) {
                $this.removeAttr('old').removeClass('changedCell')
            } else {
                $this.addClass('changedCell')
            }

            $this.toggleClass('nullCell', '(null)' == $this.text())
        })
    }

    function checkboxEditableChange(checkboxEditable) {
        var edittable = checkboxEditable.prop('checked')
        checkboxEditable.parent().find('span.editButtons').toggle(edittable)
        var dataTable = checkboxEditable.parents('div.divResult').find('table.queryResult')
        dataTable.find('.chk').toggle(edittable)
        var rowCheckboxes = dataTable.find('.dataRow').find('input[type=checkbox]')
        rowCheckboxes.unbind('click')
        if (edittable) {
            rowCheckboxes.click(toggleRowEditable)
        }
    }

    function attachEditableEvent() {
        var checkboxEditable = $('#checkboxEditable' + queryResultId)
        checkboxEditableChange(checkboxEditable)
        checkboxEditable.click(function () {
            checkboxEditableChange(checkboxEditable)
        })
    }

    function matchCellValue(cellValue, operator, operatorValue) {
        if (operator == '>=') {
            return +cellValue >= +operatorValue
        } else if (operator == '<=') {
            return +cellValue <= +operatorValue
        } else if (operator == '<>' || operator == '!=') {
            return cellValue != operatorValue
        } else if (operator == '>') {
            return +cellValue > +operatorValue
        } else if (operator == '<') {
            return +cellValue < +operatorValue
        } else if (operator == '=') {
            return cellValue == operatorValue
        } else if (operator == 'contains') {
            return cellValue.indexOf(operatorValue) > -1
        }

        return false
    }

    function rowFilter(dataTable, filter) {
        $('tr:gt(0)', dataTable).filter(function () {
            var found = false
            $('td.dataCell', $(this)).each(function (index, cell) {
                var text = $.trim($(cell).text()).toUpperCase()
                if (text.indexOf(filter) > -1) {
                    found = true
                    return false
                }
            })
            $(this).toggle(found)
        })
    }

    function fieldRowFilter(dataTable, columnName, operator, operatorValue) {
        var headRow = dataTable.find('tr.headRow').first().find('td')
        $('tr:gt(0)', dataTable).filter(function () {
            var found = false
            $('td.dataCell', $(this)).each(function (index, cell) {
                var text = $.trim($(cell).text()).toUpperCase()
                var fieldName = $(headRow.get(index + 1)).text()
                if ((columnName == "" || columnName == fieldName) && matchCellValue(text, operator, operatorValue)) {
                    found = true
                    return false
                }
            })
            $(this).toggle(found)
        })
    }

    function parseOperatorValue(operatorValue) {
        if (operatorValue.indexOf('>=') == 0) {
            return {operator: '>=', operatorValue: $.trim(operatorValue.substring(2))}
        } else if (operatorValue.indexOf('<=') == 0) {
            return {operator: '<=', operatorValue: $.trim(operatorValue.substring(2))}
        } else if (operatorValue.indexOf('!=') == 0 || operatorValue.indexOf('<>') == 0) {
            return {operator: '!=', operatorValue: $.trim(operatorValue.substring(2))}
        } else if (operatorValue.indexOf('>') == 0) {
            return {operator: '>', operatorValue: $.trim(operatorValue.substring(1))}
        } else if (operatorValue.indexOf('<') == 0) {
            return {operator: '<', operatorValue: $.trim(operatorValue.substring(1))}
        } else if (operatorValue.indexOf('=') == 0) {
            return {operator: '=', operatorValue: $.trim(operatorValue.substring(1))}
        } else {
            return {operator: 'contains', operatorValue: operatorValue}
        }
    }

    function attachSearchTableEvent() {
        $('#searchTable' + queryResultId).on('keyup change', function () {
            var dataTable = $(this).parents('div.divResult').find('table.queryResult')

            var filter = $.trim($(this).val()).toUpperCase()
            var seperatePos = filter.indexOf(':')
            if (seperatePos == -1) {
                rowFilter(dataTable, filter)
            } else {
                var columnName = $.trim(filter.substring(0, seperatePos))
                if (seperatePos == filter.length - 1) {
                    rowFilter(dataTable, filter)
                    return
                }

                var operatorValue = $.trim(filter.substring(seperatePos + 1))
                var result = parseOperatorValue(operatorValue)
                if (result.operatorValue == '') {
                    rowFilter(dataTable, filter)
                    return
                }


                var headRow = dataTable.find('tr.headRow').first().find('td')
                var foundColumn = false
                headRow.each(function (index, td) {
                    if ($(td).text() == columnName) {
                        foundColumn = true
                        return false
                    }
                })
                if (!foundColumn) {
                    rowFilter(dataTable, filter)
                    return
                }

                fieldRowFilter(dataTable, columnName, result.operator, result.operatorValue)
            }
        }).focus(function () {
            $(this).select()
        })
    }

    function copyRows($checkboxes) {
        $checkboxes.each(function (index, checkbox) {
            var $tr = $(checkbox).parents('tr')
            $tr.find(':checked').prop("checked", false)
            var $clone = $tr.clone().addClass('clonedRow')
            $clone.insertAfter($tr)
            $clone.find('input[type=checkbox]').click(toggleRowEditable).click()
        })
    }

    function attachDeleteRowsEvent() {
        var cssChoser = '#queryResult' + queryResultId + ' :checked'
        $('#deleteRows' + queryResultId).click(function () {
            $(cssChoser).parents('tr').addClass('deletedRow')
        })
    }

    function transposeRows(queryResultId, checkboxes) {
        var rowHtml = '<button id="returnToNormalView' + queryResultId + '">Return to Normal View</button>'
            + '<table><tr><td>Column Name</td>'

        checkboxes.each(function (index, chk) {
            rowHtml += '<td>#' + $(chk).parents('tr').find('td:eq(1)').text() + '</td>'
        })
        rowHtml += '</tr>'

        var table = $('#queryResult' + queryResultId)
        var headRow = table.find('tr.headRow').first().find('td')

        for (var i = 2; i < headRow.length; ++i) {
            rowHtml += '<tr><td>' + $(headRow[i]).text() + '</td>'
            checkboxes.each(function (chkIndex, chk) {
                rowHtml += '<td>' + $(chk).parents('tr').find('td').eq(i).text() + '</td>'
            })
            rowHtml += '</tr>'
        }

        rowHtml += '</table>'

        var $divTranspose = $('#divTranspose' + queryResultId)
        $divTranspose.html(rowHtml).show()
        var $divResult = $('#divResult' + queryResultId)
        $divResult.hide()

        $('#returnToNormalView' + queryResultId).click(function () {
            $divTranspose.hide()
            $divResult.show()
        })
    }

    function attachRowTransposesEvent() {
        var thisQueryResult = queryResultId
        $('#rowTranspose' + thisQueryResult).click(function () {
            var checkboxes = $('#queryResult' + thisQueryResult + ' :checked')
            transposeRows(thisQueryResult, checkboxes)
        })
    }

    function attachCopyRowsEvent() {
        var thisQueryResult = queryResultId
        $('#copyRow' + thisQueryResult).click(function () {
            var checkboxes = $('#queryResult' + thisQueryResult + ' :checked')
            if (checkboxes.length == 0) {
                alert('please specify which row to copy')
            } else {
                copyRows($(checkboxes))
            }
        })
    }

    function createResultTableHtml(result, sql, rowUpdateReady) {
        var hasRows = result.Rows && result.Rows.length > 0

        var table = '<div id="executionResultDiv' + queryResultId + '" merchantId="' + activeMerchantId + '">' +
            '<table class="executionSummary">' +
            '<tr><td>Tenant</td><td>Database</td><td>Rows</td><td>Time</td><td>Cost</td><td>Ops</td><td>Error</td><td>SQL</td></tr>'
            + '<tr>' +
            '<td>' + activeMerchantName + '</td><td>' + (result.DatabaseName || '') + '</td><td>' + (hasRows ? result.Rows.length : '0') + '</td>' +
            '<td>' + result.ExecutionTime + '</td>' +
            '<td>' + result.CostTime + '</td>' +
            '<td><span class="opsSpan" id="closeResult' + queryResultId + '">Close</span>' +
            '<span class="opsSpan" id="reExecuteSql' + queryResultId + '">Re-Execute</span></td><td'
            + (result.Error && (' class="error">' + result.Error) || ('>' + result.Msg)) + '</td>' +
            '<td class="sqlTd" contenteditable="true">' + sql + '</td>' +
            '<tr></table>'
        table += '<div id="divTranspose' + queryResultId + '" class="divTranspose"></div>'
        table += '<div id="divResult' + queryResultId + '" class="divResult">'
        if (rowUpdateReady) {
            table += '<div>'
            if (hasRows) {
                table += '<input id="searchTable' + queryResultId + '" class="searchTable" placeholder="Type to search">'
            }
            table += '<button id="expandRows' + queryResultId + '">Expand Rows</button>'
                + '<input type="checkbox" id="checkboxEditable' + queryResultId + '" class="checkboxEditable">'
                + '<label for="checkboxEditable' + queryResultId + '">Editable?</label>'
                + '<span class="editButtons"><button id="copyRow' + queryResultId + '" class="copyRow">Copy Rows</button>'
                + '<button id="deleteRows' + queryResultId + '">Tag Rows As Deleted</button>'
                + '<button id="saveUpdates' + queryResultId + '">Save Changes To DB</button>'
                + '<button id="rowTranspose' + queryResultId + '">Transpose</button>'
                + '</span></div>'
        } else if (hasRows) {
            table += '<div><input id="searchTable' + queryResultId + '" class="searchTable" placeholder="Type to search"></div>'
        }

        table += '<div id="collapseDiv' + queryResultId + '" class="collapseDiv">' +
            '<table id="queryResult' + queryResultId + '" class="queryResult">'

        if (result.Headers && result.Headers.length > 0) {
            table += '<tr class="headRow" queryResultId="' + queryResultId + '">'
            if (rowUpdateReady) {
                table += '<td><div class="chk checkAll"></div></td>'
            }
            table += '<td>#</td><td>' + result.Headers.join('</td><td>') + '</td></tr>'
        }
        if (hasRows) {
            for (var i = 0; i < result.Rows.length; i++) {
                table += '<tr class="dataRow">'
                if (rowUpdateReady) {
                    table += '<td><div class="chk checkMe"><input type="checkbox"></div></td>'
                }

                for (var j = 0; j < result.Rows[i].length; ++j) {
                    var cellValue = result.Rows[i][j]
                    if ('(null)' == cellValue) {
                        table += '<td class="dataCell nullCell">' + cellValue + '</td>'
                    } else {
                        table += '<td class="dataCell">' + cellValue + '</td>'
                    }
                }

                table += '</tr>'
            }
        } else if (result.Rows && result.Rows.length == 0) {
            table += '<tr class="dataRow clonedRow">'
            if (rowUpdateReady) {
                table += '<td><div class="chk checkMe"><input type="checkbox"></div></td>'
            }
            table += '<td class="dataCell">' + new Array(result.Headers.length + 1).join('</td><td class="dataCell">') + '</td></tr>'
        }
        table += '</table></div><br/><div></div>'

        return table
    }

    function attachOpsResultDivEvent() {
        var divId = '#executionResultDiv' + queryResultId
        $('#closeResult' + queryResultId).click(function () {
            $(divId).remove()
        })

        var resultId = queryResultId
        $('#reExecuteSql' + queryResultId).click(function () {
            var sql = $(divId).find('.sqlTd').text()
            executeSql(sql, resultId)
        })
    }

    function attachExpandRowsEvent() {
        var buttonId = '#expandRows' + queryResultId
        var collapseDiv = '#collapseDiv' + queryResultId

        $(buttonId).click(function () {
            if ($(this).text() == 'Expand Rows') {
                $(collapseDiv).removeClass('collapseDiv')
                $(this).text('Collapse Rows')
            } else {
                $(collapseDiv).addClass('collapseDiv')
                $(this).text('Expand Rows')
            }
        }).toggle($(collapseDiv).height() >= 300)
    }

    function tableCreate(result, sql, resultId) {
        var rowUpdateReady = result.TableName && result.TableName != ""

        ++queryResultId
        var table = createResultTableHtml(result, sql, rowUpdateReady)
        if (resultId && resultId > 0) {
            $('#executionResultDiv' + resultId).html(table)
        } else {
            $(table).prependTo($('.result'))
        }

        alternateRowsColor()
        attachSearchTableEvent()
        attachExpandRowsEvent()
        attachOpsResultDivEvent()

        if (rowUpdateReady) {
            attachEditableEvent()
            attachCopyRowsEvent()
            attachDeleteRowsEvent()
            attachRowTransposesEvent()
            attachSaveUpdatesEvent(result)
        }
    }

    $('.clearResult').click(function () {
        $('.result').html('')
    })

    $('.searchKey').keydown(function (event) {
        var keyCode = event.keyCode || event.which
        if (keyCode == 13) $('.searchButton').click()
    }).focus(function () {
        $(this).select()
    })

    $('.searchButton').click(function () {
        hideTablesDiv()
        $('#tidtcodeSpan').text('')
        var searchKey = $.trim($('.searchKey').val())
        if (searchKey === '') {
            alert("please input tid/tcode/tname")
            return
        }

        $.ajax({
            type: 'POST',
            url: pathname + "/searchDb",
            data: {searchKey: searchKey},
            success: function (content, textStatus, request) {
                var searchResult = $('.searchResult')
                var searchHtml = ''
                if (content && content.length) {
                    for (var j = 0; j < content.length; j++) {
                        searchHtml += '<span tid="' + content[j].MerchantId
                            + '" tcode="' + content[j].MerchantCode
                            + '" homeArea="' + content[j].HomeArea
                            + '">🌀' + content[j].MerchantName + '</span>'
                    }
                } else {
                    $('.executeQuery').prop("disabled", true)
                    $('.tables').html('')
                }
                searchResult.html(searchHtml)
                $('.searchResult span:first-child').click()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })

    function showTables(result) {
        var resultHtml = ''
        if (result.Rows && result.Rows.length > 0) {
            for (var i = 0; i < result.Rows.length; i++) {
                resultHtml += '<span>' + result.Rows[i][1] + '</span>'
            }
        }
        $('.tables').html(resultHtml)
        $('.searchTableNames').change()
    }

    function showTablesAjax(activeMerchantId) {
        $.ajax({
            type: 'POST',
            url: pathname + "/query",
            data: {tid: activeMerchantId, sql: 'show tables'},
            success: function (content, textStatus, request) {
                showTables(content)
                showTablesDiv()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    $('.tables').on('click', 'span', function (event) {
        var $button = $(this)
        var tableName = $(this).text()
        if ($button.data('alreadyclicked')) {
            $button.data('alreadyclicked', false) // reset
            if ($button.data('alreadyclickedTimeout')) {
                clearTimeout($button.data('alreadyclickedTimeout')) // prevent this from happening
            }
            executeSql('show full columns from ' + tableName)
            hideTablesDiv()
        } else {
            $button.data('alreadyclicked', true)
            var alreadyclickedTimeout = setTimeout(function () {
                $button.data('alreadyclicked', false) // reset when it happens
                executeSql('select * from ' + tableName)
                hideTablesDiv()
            }, 300) // <-- dblclick tolerance here
            $button.data('alreadyclickedTimeout', alreadyclickedTimeout) // store this id to clear if necessary
        }
        return false
    })

    var activeMerchantId = null
    var activeMerchantCode = null
    var activeHomeArea = null
    var activeMerchantName = null
    $('.searchResult').on('click', 'span', function () {
        $('.searchResult span').removeClass('active')
        var $this = $(this)
        $this.addClass('active')
        activeMerchantId = $this.attr('tid')
        activeMerchantCode = $this.attr('tcode')
        activeHomeArea = $this.attr('homeArea')
        activeMerchantName = $this.text()

        $('#tidtcodeSpan').text('tid:' + activeMerchantId + ', tcode:' + activeMerchantCode + ', homeArea:' + activeHomeArea)

        $('.executeQuery').prop("disabled", false)
        showTablesAjax(activeMerchantId)
    })


    $('.hideTables').click(function () {
        var visible = $('.tablesWrapper').toggle($(this).text() != 'Hide Tables').is(":visible")
        $(this).text(visible ? 'Hide Tables' : 'Show Tables')
        $('.searchTableNames').toggle(visible)
    })

    $('.loginButton').click(function () {
        $.ajax({
            type: 'POST',
            url: pathname + "/login",
            data: {tid: activeMerchantId, sql: 'show tables'},
            success: function (content, textStatus, request) {
                window.location = content.RedirectUrl
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })

    function hideTablesDiv() {
        $('.tablesWrapper').hide()
        $('.hideTables').text('Show Tables')
        $('.searchTableNames').hide()
    }

    function showTablesDiv() {
        $('.tablesWrapper').show()
        $('.hideTables').text('Hide Tables')
        $('.searchTableNames').show()
    }

    $('.searchTableNames').on('keyup change', function () {
        var filter = $.trim($(this).val()).toUpperCase()

        $('.tables span').each(function (index, span) {
            var $span = $(span)
            var text = $.trim($span.text()).toUpperCase()
            var contains = text.indexOf(filter) > -1
            $span.toggle(contains)
        })
    }).focus(function () {
        $(this).select()
    })

    $(document).on('paste','[contenteditable]', function(e) {
        e.preventDefault()
        var text = ''
        if (e.clipboardData || e.originalEvent.clipboardData) {
            text = (e.originalEvent || e).clipboardData.getData('text/plain')
        } else if (window.clipboardData) {
            text = window.clipboardData.getData('Text')
        }
        if (document.queryCommandSupported('insertText')) {
            document.execCommand('insertText', false, text)
        } else {
            document.execCommand('paste', false, text)
        }
    })
})()
