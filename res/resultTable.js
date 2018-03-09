(function () {
    function createHead(queryResultId, rowUpdateReady, result, isTableInLinked, contextMenuHolder) {
        var head = '<thead><tr class="headRow" queryResultId="' + queryResultId + '">'
        if (rowUpdateReady) {
            head += '<td><div class="chk checkAll"></div></td>'
        }
        head += '<td class="headCell">#</td>'

        contextMenuHolder.columnNames = contextMenuHolder.columnNames || {}
        contextMenuHolder.allColumnNames = contextMenuHolder.allColumnNames || {}

        for (var j = 0; j < result.Headers.length; ++j) {
            var headName = result.Headers[j]
            contextMenuHolder.allColumnNames[headName] = true
            head += '<td class="headCell ' + $.escapeContextMenuCssName(headName) + '">' + headName + '</td>'
            if (contextMenuHolder.hasRows && $.isInLinkedTableField(result.TableName, headName)) {
                contextMenuHolder.columnNames[headName] = true
            }
        }
        head += '</tr></thead>'


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
                 if (result.Headers) {
                    rowHtml += $.escapeContextMenuCssName(result.Headers[j - 1])
                }

                rowHtml += '">' + cellValue + '</td>'
            }

            rowHtml += '</tr>'
        }
        return rowHtml
    }


    $.createRowsSimple = function (tenantsMap, result, headerColumnsLen, dataRowsIndex) {
        var rowHtml = ''
        var tenant = tenantsMap[result.Tid]

        if (result.Rows && result.Rows.length) {
            var totalLen = result.Rows.length
            var beforeLen = parseInt(totalLen / 5) * 5
            var splitLen = totalLen - beforeLen
            for (var i = 0; i < totalLen; i++) {
                rowHtml += '<tr class="dataRow">'
                rowHtml += '<td class="dataCell">' + (dataRowsIndex + i + 1) + '</td>'
                if (i % 5 == 0) {
                    var rowspan = i < beforeLen ? 5 : splitLen
                    rowHtml +=
                        '<td class="dataCell" rowspan="' + rowspan + '">' + tenant.merchantId + '</td>' +
                        '<td class="dataCell" rowspan="' + rowspan + '">' + tenant.merchantName + '</td>' +
                        '<td class="dataCell" rowspan="' + rowspan + '">' + tenant.merchantCode + '</td>'
                } else {
                    rowHtml +=
                        '<td class="dataCell hide">' + tenant.merchantId + '</td>' +
                        '<td class="dataCell hide">' + tenant.merchantName + '</td>' +
                        '<td class="dataCell hide">' + tenant.merchantCode + '</td>'
                }
                for (var j = 0; j < result.Rows[i].length; ++j) {
                    var cellValue = result.Rows[i][j]

                    rowHtml += '<td class="dataCell">' + cellValue + '</td>'
                }

                rowHtml += '</tr>'
            }
        } else {
            rowHtml += '<tr class="dataRow">'
            rowHtml += '<td class="dataCell">' + (dataRowsIndex + 1) + '</td>' +
                '<td class="dataCell">' + tenant.merchantId + '</td>' +
                '<td class="dataCell">' + tenant.merchantName + '</td>' +
                '<td class="dataCell">' + tenant.merchantCode + '</td>'
            if (result.Error !== "" || result.Msg !== "") {
                rowHtml += '<td>1</td><td class="dataCell ' + (result.Error !== '' ? 'error' : '') + '" ' +
                    'colspan="' + (headerColumnsLen + 1) + '">' + (result.Error || result.Msg) + '</td>'
            } else {
                rowHtml += '<td>1</td><td class="dataCell ' + (result.Error !== '' ? 'error' : '') + '" ' +
                    'colspan="' + (headerColumnsLen + 1) + '">0 rows returned</td>'
            }
            rowHtml += '</tr>'
        }
        return rowHtml
    }

    function createMultipleTenantsExecutable(queryResultId, result, hasRows) {
        var holder = {}
        if (!supportsMultipleTenantsExecutable(result, hasRows, holder)) return ""

        return '<span id="multipleTenantsExecutable' + queryResultId + '">'
            + '<span class="opsSpan" merchantIdIndex="' + holder.merchantIdIndex
            + '" merchantNameIndex="' + holder.merchantNameIndex
            + '" merchantCodeIndex="' + holder.merchantCodeIndex
            + '">ExecuteSqlAmongBelowTenants</span>'
            + '<span>BatchSize:<input class="batchSize" placeholder="20">'
            + '<label><input class="confirm" type="checkbox" name="checkbox" value="value">Confirm to Continue?</label>'
            + '</span>'
            + '</span>'
    }

    function supportsMultipleTenantsExecutable(result, hasRows, holder) {
        if (!hasRows) return false

        var existsMerchantId = false
        var existsMerchantName = false
        var existsMerchantCode = false
        for (var i = 0; i < result.Headers.length; ++i) {
            var upperCaseHeader = result.Headers[i].toUpperCase();
            if (upperCaseHeader === 'MERCHANT_ID') {
                holder.merchantIdIndex = i
                existsMerchantId = true
            } else if (upperCaseHeader === 'MERCHANT_NAME') {
                holder.merchantNameIndex = i
                existsMerchantName = true
            } else if (upperCaseHeader === 'MERCHANT_CODE') {
                holder.merchantCodeIndex = i
                existsMerchantCode = true
            }

            if (existsMerchantId && existsMerchantName && existsMerchantCode) {
                return true
            }
        }

        return false
    }

    function createSummaryTable(tname, queryResultId, result, hasRows) {
        return '<div class="executionResult" id="executionResultDiv' + queryResultId + '" merchantId="' + activeMerchantId + '">' +
            '<table class="executionSummary"><tr>' +
            '<td>Tenant:&nbsp;' + tname + '</td><td>Db:&nbsp;' + (result.DatabaseName || '') + '</td>' +
            '<td>Rows:&nbsp;' + (hasRows ? result.Rows.length : '0') + '</td>' +
            '<td>Time:&nbsp;' + result.ExecutionTime + '</td>' +
            '<td>Cost:&nbsp;' + result.CostTime + '</td>' +
            '<td>' +
            '<span class="opsSpan" id="closeResult' + queryResultId + '">Close</span>' +
            createMultipleTenantsExecutable(queryResultId, result, hasRows) +
            '</td>' +
            '<td' + (result.Error && (' class="error">' + result.Error) || ('>' + result.Msg)) + '</td>' +
            '</tr></table>'
    }

    $.tableCreateSimpleHeadHtml = function (headers, sql, queryResultId) {
        var table = '<div class="executionResult" id="executionResultDiv' + queryResultId + '">' +
            '<table class="executionSummary"><tr>' +
            '<td>Tenant:&nbsp;N/A</td><td>Db:&nbsp;N/A</td>' +
            '<td>Rows:&nbsp;<span id="summaryRows' + queryResultId + '">0</span></td>' +
            '<td>Time:&nbsp;' + $.js_yyyy_mm_dd_hh_mm_ss_SSS() + '</td>' +
            '<td>Cost:&nbsp;<span id="summaryCostTime' + queryResultId + '">0</span></td>' +
            '<td><span class="opsSpan" id="closeResult' + queryResultId + '">Close</span></td>' +
            '</tr>' +
            '</table>'
        table += '<div id="divResult' + queryResultId + '" class="divResult">'
        table += '<div class="operateAreaDiv">'
        table += '<input id="searchTable' + queryResultId + '" class="searchTable" placeholder="Type to search">'
        table += '<button id="expandRows' + queryResultId + '">Expand Rows</button>'
        table += '<span class="sqlTd">' + sql + '</span>'
        table += '</div>'
        table += '<div id="collapseDiv' + queryResultId + '" class="collapseDiv">'

        table += '<table id="queryResult' + queryResultId + '" class="queryResult">'
        table += '<thead><tr class="headRow" queryResultId="' + queryResultId + '">'
        table += '<td class="headCell">#</td><td class="headCell">MERCHANT_ID</td>' +
            '<td class="headCell">MERCHANT_NAME</td>' +
            '<td class="headCell">MERCHANT_CODE</td><td class="headCell">##</td>'

        if (headers && headers.length) {
            for (var j = 0; j < headers.length; ++j) {
                table += '<td class="headCell contextMenu ' + $.escapeContextMenuCssName(headers[j]) + '">' + headers[j] + '</td>'
            }
        } else {
            table += '<td class="headCell">Msg</td>'
        }
        table += '</tr></thead>'

        table += '<tbody></tbody></table></div><br/><div></div>'

        return table
    }

    $.createResultTableHtml = function (result, sql, rowUpdateReady, resultId, contextMenuHolder, tid, tname) {
        var hasRows = result.Rows && result.Rows.length > 0
        var table = createSummaryTable(tname, resultId, result, hasRows)
        table += '<div id="divTranspose' + resultId + '" class="divTranspose"></div>'
        table += '<div id="divResult' + resultId + '" class="divResult">'
        table += '<div class="operateAreaDiv">'
        if (hasRows) {
            table += '<input id="searchTable' + resultId + '" class="searchTable" placeholder="Type to search">'
        }
        table += '<button id="expandRows' + resultId + '">Expand Rows</button>'
        if (rowUpdateReady) {
            table += '<input type="checkbox" id="checkboxEditable' + resultId + '" class="checkboxEditable">'
                + '<label for="checkboxEditable' + resultId + '">Editable?</label>'
                + '<span class="editButtons"><button id="copyRow' + resultId + '" class="copyRow">Copy Rows</button>'
                + '<button id="deleteRows' + resultId + '">Delete Rows</button>'
                + '<button id="saveUpdates' + resultId + '">Commit</button>'
                + '<button id="rowTranspose' + resultId + '">Transpose</button>'
                + '</span>'
        }
        table += '<span class="opsSpan" id="reExecuteSql' + resultId + '" tid="' + tid + '" tname="' + tname + '">Re Run:</span>'
        table += '<span class="sqlTd" contenteditable="true">' + sql + '</span>'
        table += '</div>'

        contextMenuHolder.queryResultId = resultId
        contextMenuHolder.tableName = result.TableName
        contextMenuHolder.hasRows = hasRows

        table += '<div id="collapseDiv' + resultId + '" class="collapseDiv">' +
            '<table id="queryResult' + resultId + '" class="queryResult">'

        if (result.Headers && result.Headers.length > 0) {
            var isTableInLinked = hasRows && result.TableName !== '' && $.isInLinkedTable(result.TableName)
            table += createHead(resultId, rowUpdateReady, result, isTableInLinked, contextMenuHolder)
        }

        table += '<tbody>'
        if (hasRows) {
            table += createRows(result, rowUpdateReady)
        } else if (result.Rows && result.Rows.length == 0) {
            table += '<tr class="dataRow clonedRow">'
            if (rowUpdateReady) {
                table += '<td><div class="chk checkMe"><input type="checkbox"></div></td>'
            }
            table += '<td class="dataCell">' + new Array(result.Headers.length + 1).join('</td><td class="dataCell">') + '</td></tr>'
        }
        table += '</tbody></table></div><br/><div></div>'

        return table
    }
})()