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
        $.hideTablesDiv()
    }

    $.executeSql = executeSql

    var queryResultId = 0


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
                    var insertSql = $.createInsert(cells, result)
                    sqls[sqls.length] = insertSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else if ($row.hasClass('deletedRow')) {
                    var deleteSql = 'delete from ' + result.TableName + ' '
                    deleteSql = $.createWherePart(deleteSql, result, headRow, cells)
                    sqls[sqls.length] = deleteSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else {
                    var updateSql = $.createUpdateSetPart(cells, result, headRow)

                    if (updateSql != null) {
                        updateSql = $.createWherePart(updateSql, result, headRow, cells)
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
        $.attachSearchTableEvent(queryResultId)
        attachExpandRowsEvent()
        attachOpsResultDivEvent()

        if (rowUpdateReady) {
            attachEditableEvent()
            attachCopyRowsEvent()
            attachDeleteRowsEvent()
            $.attachRowTransposesEvent(queryResultId)
            attachSaveUpdatesEvent(result)
        }
    }

    $('.clearResult').click(function () {
        $('.result').html('')
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
})()
