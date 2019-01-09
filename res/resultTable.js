(function () {
    function createHead(resultId, result, isTableInLinked, contextMenuHolder) {
        var head = '<thead><tr class="headRow">'
        head += '<td></td>'
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
        return head + '</tr></thead>'
    }


    function createRows(result) {
        var rowHtml = ''
        for (var i = 0; i < result.Rows.length; i++) {
            rowHtml += '<tr class="dataRow">'
            rowHtml += '<td></td>'

            for (var j = 0; j < result.Rows[i].length; ++j) {
                var cellValue = result.Rows[i][j]
                var needEscape = $.isEscapeRequired(cellValue)

                if (needEscape) {
                    rowHtml += '<td class="dataCell textAreaTd '
                } else {
                    rowHtml += '<td class="dataCell '
                }
                if (result.Headers && !needEscape) {
                    rowHtml += $.escapeContextMenuCssName(result.Headers[j - 1])
                }

                if (needEscape) {
                    rowHtml += '"><textarea readonly>' + cellValue + '</textarea></td>'
                } else {
                    rowHtml += '">' + cellValue + '</td>'
                }
            }

            rowHtml += '</tr>'
        }
        return rowHtml
    }

    function createMultipleTenantsExecutable(queryResultId, result, hasRows) {
        var holder = {}
        if (!supportsMultipleTenantsExecutable(result, hasRows, holder)) return ""

        return '<span id="multipleTenantsExecutable' + queryResultId + '">'
            + '<span class="opsSpan" merchantIdIndex="' + holder.tiIndex
            + '" merchantNameIndex="' + holder.tnameIndex
            + '" merchantCodeIndex="' + holder.tcodeIndex
            + '">ExecuteSqlAmongTenants</span>'
            + '<span>BatchSize:<input class="batchSize" placeholder="20">'
            + '<label><input class="confirm" type="checkbox" name="checkbox" value="value">Confirm to Continue?</label>'
            + '</span>'
            + '</span>'
    }

    function findColumnIndex(headers, headerName) {
        for (var i = 0; i < headers.length; ++i) {
            if (headers[i].toUpperCase() === headerName) return i
        }

        return -1
    }

    function supportsMultipleTenantsExecutable(result, hasRows, holder) {
        if (!hasRows) return false

        var headers = result.Headers
        holder.tiIndex = findColumnIndex(headers, 'MERCHANT_ID')
        holder.tnameIndex = findColumnIndex(headers, 'MERCHANT_NAME')
        holder.tcodeIndex = findColumnIndex(headers, 'MERCHANT_CODE')

        return holder.tiIndex >= 0 && holder.tnameIndex >= 0 && holder.tcodeIndex >= 0
    }

    $.convertSeqNum = function (resultId) {
        if (resultId >= 0 && resultId <= 9) return resultId
        // since 97 is the ascii value for 'a',
        if (resultId >= 10 && resultId <= 35) return String.fromCharCode('a'.charCodeAt(0) + (resultId - 10))

        return resultId
    }

    function createSummaryTable(classifier, tid, tcode, tname, resultId, result, hasRows) {
        var seqNum = $.convertSeqNum(resultId)
        return '<div class="executionResult" id="executionResultDiv' + resultId + '" tid="' + tid + '" tcode="' + tcode + '" classifier="' + classifier + '">' +
            '<table class="executionSummary"><tr>' +
            '<td class="resultId" id="resultId' + resultId + '">#' + seqNum + '</td>' +
            (multiTenants === 'true' ? '<td>Tenant:&nbsp;' + tname + '&nbsp;' + tcode + '</td><td>Db:&nbsp;' + (result.DatabaseName || '') + '</td>' : '') +
            '<td>Table:&nbsp;<span>' + (result.TableName || 'xxx') + '</span><span class="tableTools" id="tableTools' + resultId + '">...</span></td>' +
            '<td>Rows:<span contenteditable="true" id="maxRows' + resultId + '">' + (hasRows ? result.Rows.length : '0') + '</span></td>' +
            '<td>Time:&nbsp;' + result.ExecutionTime + '</td>' +
            '<td>Cost:&nbsp;' + result.CostTime + '</td>' +
            '<td><span class="opsSpan" id="screenShot' + resultId + '">截图</span></td>' +
            '<td>' +
            '<span class="opsSpan" id="closeResult' + resultId + '">Close</span>' +
            createMultipleTenantsExecutable(resultId, result, hasRows) +
            '</td>' +
            '<td' + (result.Error && (' class="error">' + result.Error) || ('>' + result.Msg)) + '</td>' +
            '</tr></table>'
    }

    $.createResultTableHtml = function (result, sql, rowUpdateReady, resultId, contextMenuHolder, classifier, tid, tcode, tname) {
        var hasRows = result.Rows && result.Rows.length > 0
        var table = createSummaryTable(classifier, tid, tcode, tname, resultId, result, hasRows)
        table += '<div id="divTranspose' + resultId + '" class="hide"></div>'
        table += '<div id="divResult' + resultId + '" class="divResult">'
        table += '<div class="operateAreaDiv">'
        table += '<input title="Search in the rows" id="searchTable' + resultId + '" class="searchTable" placeholder="Type to search">'

        table += '<button title="Transpose rows" id="rowTranspose' + resultId + '"><span class="context-menu-icons context-menu-icon-transpose"></span></button>'
        table += '<button title="Mark rows or cells" id="markRowsOrCells' + resultId + '"><span class="context-menu-icons context-menu-icon-mark"></span></button>'
        table += '<button title="Expand/Collapse Rrows" id="expandRows' + resultId + '"><span class="context-menu-icons context-menu-icon-expand"></span></button>'
        if (rowUpdateReady) {
            table += '<input title="Start to change" type="checkbox" id="checkboxEditable' + resultId + '" class="checkboxEditable">'
                + '<label title="Start to change" for="checkboxEditable' + resultId + '"><span class="context-menu-icons context-menu-icon-edit"></span></label>'
                + '<span class="editButtons"><button title="Clone rows" id="copyRow' + resultId + '" class="copyRow"><span class="context-menu-icons context-menu-icon-cloneRows"></span></button>'
                + '<button title="Tag rows as deleted" id="deleteRows' + resultId + '"><span class="context-menu-icons context-menu-icon-deleteRows"></span></button>'
                + '<button title="Commit changes" id="saveUpdates' + resultId + '"><span class="context-menu-icons context-menu-icon-commitChanges"></span></button>'
                + '</span>'
        }

        table += '<span title="Click to rerun sql" class="opsSpan reRunSql" id="reExecuteSql' + resultId + '" tid="' + tid + '" tcode="' + tcode + '" tname="' + tname + '" classifier="' + classifier + '">Re Run:</span>'
        table += '<span title="Show/Change sql here" class="sqlTd" id="sqlDiv' + resultId + '" contenteditable="true">' + sql + '</span>'
        table += '</div>'

        contextMenuHolder.queryResultId = resultId
        contextMenuHolder.tableName = result.TableName
        contextMenuHolder.hasRows = hasRows
        table += '<div id="collapseDiv' + resultId + `" class="collapseDiv">` +
            '<table id="queryResult' + resultId + '" class="queryResult">'

        if (result.Headers && result.Headers.length > 0) {
            var isTableInLinked = hasRows && result.TableName !== '' && $.isInLinkedTable(result.TableName)
            table += createHead(resultId, result, isTableInLinked, contextMenuHolder)
        }

        table += '<tbody>'
        if (hasRows) {
            table += createRows(result)
        } else if (result.Rows && result.Rows.length == 0) {
            table += '<tr class="dataRow clonedRow">'
            table += '<td></td>'
            table += '<td class="dataCell">' + new Array((result.Headers ? result.Headers.length : 0) + 1).join('</td><td class="dataCell">') + '</td></tr>'
        }
        table += '</tbody></table></div>'

        return table
    }
})()