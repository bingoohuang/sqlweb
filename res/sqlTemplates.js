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
                if (rowSeq === 1) {
                    table += '<td class="excelPasteable" colIndex="' + (i + 1) + '" contenteditable="true"></td>'
                } else {
                    table += '<td contenteditable="true"></td>'
                }
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

            var templateEval = template.compile(sqlTemplate)

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
                    evalResult.push(templateEval(varValues))
                }
            })

            var evalFinal = evalResult.join('\n')
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


    function AutoIncrementHighlightedColumns($resultTable, autoIncr) {
        var highlightedColumnIndexes = $.findHighlightedColumnIndexes($resultTable)
        if (highlightedColumnIndexes.length == 0) {
            alert("There is no columns highlighted!")
            return
        }

        var baseValue = {}

        var $tds = $resultTable.find('tbody tr:eq(0) td');
        for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
            var index = highlightedColumnIndexes[i];
            var value = $tds.eq(index).text()
            if (!value) {
                alert("There is no base value in highlighted column at index " + (i + 1) + "!")
                return
            }
            baseValue[index] = value
        }

        $resultTable.find('tbody tr:gt(0)').each(function (rowIndex, tr) {
            var tds = $(tr).find('td')
            for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
                var index = highlightedColumnIndexes[i]
                if (autoIncr) {
                    baseValue[index] = $.incr(baseValue[index])
                }
                tds.eq(index).text(baseValue[index])
            }
        })
    }

    var populateDataToTable = function (text, $resultTable, colIndex) {
        var clipRows = text.split(/[\r\n]+/)
        for (i = 0; i < clipRows.length; i++) {
            clipRows[i] = clipRows[i].split(/\s+/)
        }
        // result clipRows[i][j]

        var $tbody = $resultTable.find('tbody')

        var colOffset = colIndex ? +colIndex : 1

        var x = clipRows
        var $rows = $tbody.find('tr')
        for (var i = 0; i < $rows.length && i < x.length; i++) {
            y = x[i]
            var $tds = $rows.eq(i).find('td')
            $tds.eq(0).text(i + 1)
            for (var j = 0; j < y.length; ++j) {
                $tds.eq(j + colOffset).text($.trim(y[j]))
            }
        }

        var lastRow = $tbody.find('tr:last')
        for (var i = $rows.length; i < x.length; i++) {
            y = x[i]

            var $clone = lastRow.clone()
            var $tds = $clone.find('td')
            $tds.eq(0).text(i + 1)
            for (var j = 0; j < y.length; ++j) {
                $tds.eq(j + colOffset).text($.trim(y[j]))
            }

            $tbody.append($clone)
        }
    }

    function PopulateByEditorData($resultTable) {
        var $tbody = $resultTable.find('tbody')
        var data = $.trim($.getEditorText())
        if (data === "") {
            alert('There is no data populated!')
        }

        populateDataToTable(data, $resultTable)
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
        $.attachHighlightColumnEvent(resultId)
        attachSpreadPasteEvent(resultId)
    }

    var attachSpreadPasteEvent = function (resultId) {
        var queryResultId = '#queryResult' + resultId
        $(document).on('paste', queryResultId + ' td.excelPasteable', function (e) {
            var clipText = $.clipboardText(e)
            var $resultTable = $(queryResultId)
            var $td = $(this)

            populateDataToTable(clipText, $resultTable, $td.attr('colIndex'))
        })
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
                } else if (key === 'PopulateByEditorData') {
                    PopulateByEditorData($resultTable)
                } else if (key === 'AutoIncrementHighlightedColumns') {
                    AutoIncrementHighlightedColumns($resultTable, true)
                } else if (key  === 'DuplicateHighlightedColumns') {
                    AutoIncrementHighlightedColumns($resultTable, false)
                }
            },
            items: {
                ExportAsTsv: {name: "Export As TSV To Clipboard", icon: "columns"},
                PopulateByEditorData: {name: "Populate By Editor Data", icon: "columns"},
                AutoIncrementHighlightedColumns: {name: "Auto Increment Highlighted Columns", icon: "columns"},
                DuplicateHighlightedColumns: {name: "Duplicate Highlighted Columns", icon: "columns"},
            }
        })
    }
})()