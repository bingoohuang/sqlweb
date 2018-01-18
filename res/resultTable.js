(function () {
    function createRows(result, rowUpdateReady, isTableInLinked, contextMenuHolder) {
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
                }

                if (isTableInLinked && result.Headers) {
                    var columnName = result.Headers[j - 1]
                    if ($.isInLinkedTableField(result.TableName, columnName)) {
                        rowHtml += 'contextMenu-' + columnName

                        contextMenuHolder.contextMenuRequired = true
                        contextMenuHolder.columnNames = contextMenuHolder.columnNames || {}
                        contextMenuHolder.columnNames[columnName] = true
                    }
                }

                rowHtml += '">' + cellValue + '</td>'
            }

            rowHtml += '</tr>'
        }
        return rowHtml;
    }

    function rowUpdateOperateArea(hasRows, queryResultId) {
        var html = '<div class="operateAreaDiv">'
        if (hasRows) {
            html += '<input id="searchTable' + queryResultId + '" class="searchTable" placeholder="Type to search">'
        }
        html += '<button id="expandRows' + queryResultId + '">Expand Rows</button>'
            + '<input type="checkbox" id="checkboxEditable' + queryResultId + '" class="checkboxEditable">'
            + '<label for="checkboxEditable' + queryResultId + '">Editable?</label>'
            + '<span class="editButtons"><button id="copyRow' + queryResultId + '" class="copyRow">Copy Rows</button>'
            + '<button id="deleteRows' + queryResultId + '">Tag Rows As Deleted</button>'
            + '<button id="saveUpdates' + queryResultId + '">Save Changes To DB</button>'
            + '<button id="rowTranspose' + queryResultId + '">Transpose</button>'
            + '</span></div>'
        return html;
    }

    function createSummaryTable(queryResultId, result, hasRows, sql) {
        return '<div id="executionResultDiv' + queryResultId + '" merchantId="' + activeMerchantId + '">' +
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
            '<tr></table>';
    }

    $.createResultTableHtml = function (result, sql, rowUpdateReady, queryResultId, contextMenuHolder) {
        var hasRows = result.Rows && result.Rows.length > 0
        var table = createSummaryTable(queryResultId, result, hasRows, sql);
        table += '<div id="divTranspose' + queryResultId + '" class="divTranspose"></div>'
        table += '<div id="divResult' + queryResultId + '" class="divResult">'
        if (rowUpdateReady) {
            table += rowUpdateOperateArea(hasRows, queryResultId);
        } else if (hasRows) {
            table += '<div><input id="searchTable' + queryResultId + '" class="searchTable" placeholder="Type to search"></div>'
        }

        contextMenuHolder.tableId = 'queryResult' + queryResultId
        contextMenuHolder.tableName = result.TableName

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
            var isTableInLinked = result.TableName !== '' && $.isInLinkedTable(result.TableName)
            table += createRows(result, rowUpdateReady, isTableInLinked, contextMenuHolder);
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