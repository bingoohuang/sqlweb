(function () {
    function createHead(queryResultId, rowUpdateReady, result, isTableInLinked, contextMenuHolder) {
        var head = '<tr class="headRow" queryResultId="' + queryResultId + '">'
        if (rowUpdateReady) {
            head += '<td><div class="chk checkAll"></div></td>'
        }
        head += '<td>#</td>'

        contextMenuHolder.columnNames = contextMenuHolder.columnNames || {}
        contextMenuHolder.allColumnNames = contextMenuHolder.allColumnNames || {}

        for (var j = 0; j < result.Headers.length; ++j) {
            var headName = result.Headers[j]
            contextMenuHolder.allColumnNames[headName] = true
            head += '<td class="headCell contextMenu-' + headName + '">' + headName + '</td>'
            if (contextMenuHolder.hasRows && $.isInLinkedTableField(result.TableName, headName)) {
                contextMenuHolder.columnNames[headName] = true
            }
        }
        head += '</tr>'


        return head
    }

    function createRows(result, rowUpdateReady) {
        var rowHtml = ''
        for (var i = 0; i < result.Rows.length; i++) {
            rowHtml += '<tr class="dataRow">'
            if (rowUpdateReady) {
                rowHtml += '<td><div class="chk checkMe"><input type="checkbox"></div></td>'
            }

            for (var j = 0; j < result.Rows[i].length; ++j) {
                var cellValue = result.Rows[i][j]

                rowHtml += '<td class="dataCell '
                if ('(null)' == cellValue) {
                    rowHtml += 'nullCell '
                } else if (result.Headers) {
                    rowHtml += 'contextMenu-' + result.Headers[j - 1]
                }

                rowHtml += '">' + cellValue + '</td>'
            }

            rowHtml += '</tr>'
        }
        return rowHtml
    }

    function rowUpdateOperateArea(hasRows, queryResultId) {
        return '<button id="expandRows' + queryResultId + '">Expand Rows</button>'
            + '<input type="checkbox" id="checkboxEditable' + queryResultId + '" class="checkboxEditable">'
            + '<label for="checkboxEditable' + queryResultId + '">Editable?</label>'
            + '<span class="editButtons"><button id="copyRow' + queryResultId + '" class="copyRow">Copy Rows</button>'
            + '<button id="deleteRows' + queryResultId + '">Tag Rows As Deleted</button>'
            + '<button id="saveUpdates' + queryResultId + '">Save Changes To DB</button>'
            + '<button id="rowTranspose' + queryResultId + '">Transpose</button>'
            + '</span>'
            + '<span class="clickable hide" id="showSummary' + queryResultId + '">Show Summary</span>'
    }

    function createSummaryTable(queryResultId, result, hasRows) {
        return '<div id="executionResultDiv' + queryResultId + '" merchantId="' + activeMerchantId + '">' +
            '<table class="executionSummary"><tr>' +
            '<td>Tenant:&nbsp;' + activeMerchantName + '</td><td>Db:&nbsp;' + (result.DatabaseName || '') + '</td>' +
            '<td>Rows:&nbsp;' + (hasRows ? result.Rows.length : '0') + '</td>' +
            '<td>Time:&nbsp;' + result.ExecutionTime + '</td>' +
            '<td>Cost:&nbsp;' + result.CostTime + '</td>' +
            '<td>' +
            '<span class="opsSpan" id="closeResult' + queryResultId + '">Close</span>' +
            '<span class="opsSpan" id="hideSummary' + queryResultId + '">Hide</span>' +
            '</td>' +
            '<td' + (result.Error && (' class="error">' + result.Error) || ('>' + result.Msg)) + '</td>' +
            '</tr></table>'
    }

    $.createResultTableHtml = function (result, sql, rowUpdateReady, queryResultId, contextMenuHolder) {
        var hasRows = result.Rows && result.Rows.length > 0
        var table = createSummaryTable(queryResultId, result, hasRows)
        table += '<div id="divTranspose' + queryResultId + '" class="divTranspose"></div>'
        table += '<div id="divResult' + queryResultId + '" class="divResult">'
        table += '<div class="operateAreaDiv">'
        if (hasRows) {
            table += '<input id="searchTable' + queryResultId + '" class="searchTable" placeholder="Type to search">'
        }
        if (rowUpdateReady) {
            table += '<button id="expandRows' + queryResultId + '">Expand Rows</button>'
                + '<input type="checkbox" id="checkboxEditable' + queryResultId + '" class="checkboxEditable">'
                + '<label for="checkboxEditable' + queryResultId + '">Editable?</label>'
                + '<span class="editButtons"><button id="copyRow' + queryResultId + '" class="copyRow">Copy Rows</button>'
                + '<button id="deleteRows' + queryResultId + '">Delete Rows</button>'
                + '<button id="saveUpdates' + queryResultId + '">Commit</button>'
                + '<button id="rowTranspose' + queryResultId + '">Transpose</button>'
                + '</span>'
                + '<span class="opsSpan hide" id="showSummary' + queryResultId + '">Show Summary</span>'
        }
        table += '<span class="opsSpan" id="reExecuteSql' + queryResultId + '">Re Run:</span>'
        table += '<span class="sqlTd" contenteditable="true">' + sql + '</span>'
        table += '</div>'

        contextMenuHolder.queryResultId = queryResultId
        contextMenuHolder.tableName = result.TableName
        contextMenuHolder.hasRows = hasRows

        table += '<div id="collapseDiv' + queryResultId + '" class="collapseDiv">' +
            '<table id="queryResult' + queryResultId + '" class="queryResult">'

        if (result.Headers && result.Headers.length > 0) {
            var isTableInLinked = hasRows && result.TableName !== '' && $.isInLinkedTable(result.TableName)
            table += createHead(queryResultId, rowUpdateReady, result, isTableInLinked, contextMenuHolder)
        }
        if (hasRows) {
            table += createRows(result, rowUpdateReady)
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
})()