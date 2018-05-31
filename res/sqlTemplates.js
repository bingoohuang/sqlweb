(function () {
    function createTemplateSummaryTable(resultId) {
        var seqNum = $.convertSeqNum(resultId)
        return '<div class="executionResult" id="executionResultDiv' + resultId + '">' +
            '<table class="executionSummary"><tr>' +
            '<td class="resultId" id="resultId' + resultId + '">#' + seqNum + '</td>' +
            '<td>Template Processing</td>' +
            '<td><span class="opsSpan" id="closeResult' + resultId + '">Close</span>' +
            '</td>' +
            '</tr></table>'
    }

    function createTable(resultId, templateVars) {
        var table = '<table id="queryResult' + resultId + '" class="queryResult">'
        table += '<thead><tr><td>#</td>'
        for (var i = 0; i < templateVars.length; ++i) {
            table += '<td>' + templateVars[i] + '</td>'
        }

        table += '</tr></thead><tbody>'

        for (var rowSeq = 1; rowSeq <= 5; ++rowSeq) {
            table += '<tr><td>' + rowSeq + '</td>'
            for (var i = 0; i < templateVars.length; ++i) {
                table += '<td contenteditable="true"></td>'
            }
            table += '</tr>'
        }

        return table + '</tbody></table>'
    }

    function bindReExecuteSql(reExecuteId, resultId) {
        $(reExecuteId).click(function () {
            var sql = $('#executionResultDiv' + resultId).find('.sqlTd').text()
            $.templateSql(sql, resultId)
        })

        $('#sqlDiv' + resultId).keydown(function (event) {
            if ((event.metaKey || event.ctrlKey) && event.keyCode == 13) {
                $(reExecuteId).click()
            }
        })
    }

    function attachEvalEvent(resultId) {
        $('#evalSql' + resultId).click(function () {
            var $table = $('#queryResult' + resultId)
            var templateVars = {}
            $table.find('thead td').each(function (index, td) {
                templateVars[index] = $(td).text()
            })

            var evalResult = []
            var sqlTemplate = $('#executionResultDiv' + resultId).find('.sqlTd').text()

            $table.find('tbody tr').each(function (i, tr) {
                var varValues = {}
                var usable = false
                $(tr).find('td').each(function (index, td) {
                    if (index > 0) {
                        var text = $(td).text()
                        if (text !== "") usable = true

                        varValues[templateVars[index]] = text
                    }
                })

                if (usable) {
                    evalResult.push($.templateEval(sqlTemplate, varValues))
                }
            })

            var evalFinal = evalResult.join('\n\n')
            $.appendSqlToSqlEditor(evalFinal, true, true)
        })
    }

    function attachMoreRowsEvent(resultId) {
        $('#moreRows' + resultId).click(function () {
            var $tbody = $('#queryResult' + resultId + " tbody")
            var $tr = $tbody.find('tr:last')
            var seq = +$tr.find('td:first').text()
            for (var rowSeq = 5; rowSeq >= 1; --rowSeq) {
                var $clone = $tr.clone()
                $clone.find('td:first').text(rowSeq + seq)
                $clone.insertAfter($tr)
            }
        })
    }

    function attachCloseEvent(resultId) {
        $('#closeResult' + resultId).click(function () {
            $('#executionResultDiv' + resultId).remove()
        })
    }

    $.templateSql = function (sql, oldResultId) {
        var resultId = oldResultId !== null && oldResultId >= 0 ? oldResultId : ++queryResultId
        var html = createTemplateSummaryTable(resultId)

        html += '<div id="divResult' + resultId + '" class="divResult">'
        html += '<div class="operateAreaDiv">'
        html += '<span class="opsSpan reRunSql" id="evalSql' + resultId + '">Eval</span>&nbsp;&nbsp;'
        html += '<span class="opsSpan reRunSql" id="moreRows' + resultId + '">More Rows</span>&nbsp;&nbsp;'
        html += '<span class="opsSpan reRunSql" id="reTemplateSql' + resultId + '">Re Run</span>:'
        html += '<span class="sqlTd" id="sqlDiv' + resultId + '" contenteditable="true">' + sql + '</span>'
        html += '</div>'

        var templateVars = $.templateParse(sql)
        if (!templateVars || templateVars.length == 0) {
            alert('No template variables found')
            return
        }

        html += createTable(resultId, templateVars) + '</div><br/>'

        $.replaceOrPrependResult(resultId, oldResultId, html)

        showHideColumns(resultId)
        attachCloseEvent(resultId)
        attachEvalEvent(resultId)
        attachMoreRowsEvent(resultId)
        bindReExecuteSql('#reTemplateSql' + resultId, resultId)
    }

    var showHideColumns = function (resultId) {
        var queryResultId = '#queryResult' + resultId;
        $.contextMenu({
            zIndex: 10,
            selector: '#resultId' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                var $resultTable = $(queryResultId)

                if (key === 'ExportAsTsv') {
                    var csv = []
                    $resultTable.find('tr:visible').each(function (index, tr) {
                        var csvLine = []
                        var usable = false
                        $(tr).find('td').each(function (index, td) {
                            var text = $(td).text()
                            if (index > 0 && text !== "") usable = true

                            csvLine.push($.csvString(text))
                        })

                        if (usable) csv.push(csvLine.join('\t'))
                    })
                    $.copyTextToClipboard(csv.join('\n'))
                    $.copiedTips('TSV copied.')
                }
            },
            items: {
                ExportAsTsv: {name: "Export As TSV To Clipboard", icon: "columns"},
            }
        })
    }
})()