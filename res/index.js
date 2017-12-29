(function () {
    function copyRows($checkboxes) {
        $checkboxes.each(function (index, checkbox) {
            var $tr = $(checkbox).parents('tr')
            $tr.find(':checked').prop("checked", false)
            var $clone = $tr.clone().addClass('clonedRow')
            $clone.insertAfter($tr)
            $clone.find('input[type=checkbox]').click($.toggleRowEditable).click()
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
            $.executeQueryAjax(sql, resultId)
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

    $.tableCreate = function (result, sql, resultId) {
        var rowUpdateReady = result.TableName && result.TableName != ""

        ++queryResultId
        var table = createResultTableHtml(result, sql, rowUpdateReady)
        if (resultId && resultId > 0) {
            $('#executionResultDiv' + resultId).html(table)
        } else {
            $(table).prependTo($('.result'))
        }

        $('#queryResult' + queryResultId + ' tr:even').addClass('rowEven')
        $.attachSearchTableEvent(queryResultId)
        attachExpandRowsEvent()
        attachOpsResultDivEvent()

        if (rowUpdateReady) {
            $.attachEditableEvent(queryResultId)
            attachCopyRowsEvent()
            attachDeleteRowsEvent()
            $.attachRowTransposesEvent(queryResultId)
            $.attachSaveUpdatesEvent(result, queryResultId)
        }
    }
})()
