(function () {
    function createTemplateSummaryTable(resultId) {
        var seqNum = $.convertSeqNum(resultId)
        return '<div class="executionResult" id="executionResultDiv' + resultId + '">' +
            '<table class="executionSummary"><tr>' +
            '<td class="resultId" id="resultId' + resultId + '">#' + seqNum + '</td>' +
            '<td>Template Processing</td>' +
            '<td><span class="opsSpan" id="screenShot' + resultId + '">截图</span></td>' +
            '<td><span class="opsSpan" id="closeResult' + resultId + '">Close</span></td>' +
            '</tr></table>'
    }

    function createTable(resultId, templateVars) {
        var table = '<table id="queryResult' + resultId + `" class="queryResult">`
        table += '<thead><tr><td></td><td>#</td>'
        for (var i = 0; i < templateVars.length; ++i) {
            table += '<td contenteditable="true">' + templateVars[i] + '</td>'
        }

        table += '</tr></thead><tbody>'

        for (var rowSeq = 1; rowSeq <= 5; ++rowSeq) {
            table += '<tr><td></td><td>' + rowSeq + '</td>'
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

        $('#sqlDiv' + resultId)
            .keydown(function (event) {
                if ((event.metaKey || event.ctrlKey) && event.keyCode === 13) {
                    $(reExecuteId).click()
                }
            })
            .blur(function () {
                if ($.trim($(this).text()) == '') {
                    $(this).text('xxx')
                }
            })
    }

    function attachEvalEvent(resultId) {
        $('#evalSql' + resultId).click(function () {
            var $table = $('#queryResult' + resultId)
            var templateVars = {}
            $table.find('thead td').each(function (index, td) {
                if (index > 1) templateVars[index] = $(td).text()
            })

            var evalResult = []
            var sqlTemplate = $('#executionResultDiv' + resultId).find('.sqlTd').text()

            try {
                var templateEval = template.compile(sqlTemplate, {escape: false})

                $table.find('tbody tr').each(function (i, tr) {
                    var varValues = {index: i}
                    var usable = false
                    $(tr).find('td').each(function (index, td) {
                        if (index > 1) {
                            var text = $.cellValue($(td))
                            if (text !== "") usable = true

                            var val = $('#escapleSqlValues' + resultId).prop("checked") ? $.escapeSqlValue(text) : text;
                            varValues[templateVars[index]] = val
                        }
                    })

                    if (usable) {
                        evalResult.push(templateEval(varValues))
                    }
                })
            } catch (e) {
                $.alertMe(JSON.stringify(e))
            }

            var evalFinal = evalResult.join('\n')
            $.appendSqlToSqlEditor(evalFinal, true, true)
        })
    }

    function attachMoreRowsEvent(resultId) {
        $('#moreRows' + resultId).click(function () {
            var $tbody = $('#queryResult' + resultId + " tbody")
            var $tr = $tbody.find('tr:last')
            var seq = +$tr.find('td:eq(1)').text()
            for (var rowSeq = 5; rowSeq >= 1; --rowSeq) {
                var $clone = $tr.clone()
                $clone.find('td:eq(1)').text(rowSeq + seq)
                $clone.insertAfter($tr)
            }
        })
    }

    function MapHighlightedColumns($resultTable) {
        var highlightedColumnIndexes = $.findHighlightedColumnIndexes($resultTable)
        if (highlightedColumnIndexes.length == 0) {
            $.alertMe("There is no columns highlighted!")
            return
        }

        $.promptMe('Please input mapper funcion with input argument name x', function (mapper) {
            var fn = new Function("x", mapper)

            $resultTable.find('tbody tr').each(function (rowIndex, tr) {
                var tds = $(tr).find('td')
                for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
                    var index = highlightedColumnIndexes[i]
                    var td = tds.eq(index);
                    var from = td.text()
                    td.text(fn(from))
                }
            })
        }, "var d = new Date(x)\n" +
            "d.setDate(d.getDate()-1)\n" +
            "return d.toISOString().substring(0, 10) + ' 20:00:00'")
    }

    function DeleteHighlightedColumns($resultTable) {
        var highlightedColumnIndexes = $.findHighlightedColumnIndexes($resultTable)
        if (highlightedColumnIndexes.length == 0) {
            $.alertMe("There is no columns highlighted!")
            return
        }

        $resultTable.find('tr').each(function (rowIndex, tr) {
            var tds = $(tr).find('td')
            var highlightedTds = []
            for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
                highlightedTds.push(tds.eq(highlightedColumnIndexes[i]))
            }

            for (var i = 0; i < highlightedTds.length; ++i) {
                highlightedTds[i].remove()
            }
        })
    }

    function NewBeforeHighlightedColumns($resultTable, direction) {
        var highlightedColumnIndexes = $.findHighlightedColumnIndexes($resultTable)
        if (highlightedColumnIndexes.length == 0) {
            $.alertMe("There is no columns highlighted!")
            return
        }

        var headClones = []

        $resultTable.hide()

        $resultTable.find('tr').each(function (rowIndex, tr) {
            var tds = $(tr).find('td')
            var highlightedTds = []
            for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
                var index = highlightedColumnIndexes[i]
                highlightedTds.push(tds.eq(index))
            }


            for (var i = 0; i < highlightedTds.length; ++i) {
                var highlightedTd = highlightedTds[i];
                var clone = highlightedTd.clone()
                $(clone).text(rowIndex == 0 ? 'new' : '').removeClass('highlight')
                if (rowIndex == 0) {
                    headClones.push(clone)
                }

                if (direction === 'right') {
                    clone.insertAfter(highlightedTd)
                } else {
                    clone.insertBefore(highlightedTd)
                }
            }
        })

        for (var i = 0; i < headClones.length; ++i) {
            highlightColumn($resultTable, $(headClones[i]))
        }

        $resultTable.show()
    }
    function CloneHighlightedColumns($resultTable) {
        var highlightedColumnIndexes = $.findHighlightedColumnIndexes($resultTable)
        if (highlightedColumnIndexes.length == 0) {
            $.alertMe("There is no columns highlighted!")
            return
        }

        var headClones = []

        $resultTable.hide()

        $resultTable.find('tr').each(function (rowIndex, tr) {
            var tds = $(tr).find('td')
            var highlightedTds = []
            for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
                var index = highlightedColumnIndexes[i]
                highlightedTds.push(tds.eq(index))
            }


            for (var i = 0; i < highlightedTds.length; ++i) {
                var highlightedTd = highlightedTds[i];
                var clone = highlightedTd.clone()
                if (rowIndex == 0) {
                    headClones.push(clone)
                }

                clone.insertAfter(highlightedTd)
            }
        })

        for (var i = 0; i < headClones.length; ++i) {
            highlightColumn($resultTable, $(headClones[i]))
        }

        $resultTable.show()
    }

    function AutoIncrementHighlightedColumns($resultTable, autoIncr) {
        var highlightedColumnIndexes = $.findHighlightedColumnIndexes($resultTable)
        if (highlightedColumnIndexes.length == 0) {
            $.alertMe("There is no columns highlighted!")
            return
        }

        var baseValue = {}
        var $tds = $resultTable.find('tbody tr:eq(0) td')
        for (var i = 0; i < highlightedColumnIndexes.length; ++i) {
            var index = highlightedColumnIndexes[i]
            var value = $tds.eq(index).text()
            if (!value) {
                $.alertMe("There is no base value in highlighted column at index " + (i + 1) + "!")
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

    function splitRowsAndColumns(text) {
        var clipRows = text.split(/[\r\n]+/)
        for (var i = 0; i < clipRows.length; i++) {
            clipRows[i] = clipRows[i].split(/\t+/)
        }
        return clipRows
    }

    function populateDataToTable(text, $resultTable, $td) {
        var $tbody = $resultTable.find('tbody')
        $tbody.hide()
        var $rows = $tbody.find('tr')

        var colOffset = $td ? $td.parent().find('td').index($td) : 2
        var rowOffset = $td ? $rows.index($td.parent()) : 0

        var i = 0
        var x = splitRowsAndColumns(text)
        for (; i + rowOffset < $rows.length && i < x.length; i++) {
            var $tds = $rows.eq(i + rowOffset).find('td')
            populateRow($tds, x, i, rowOffset, colOffset)
        }

        var lastRow = $tbody.find('tr:last')
        for (; i < x.length; i++) {
            var $clone = lastRow.clone()
            populateRow($clone.find('td'), x, i, rowOffset, colOffset)
            $tbody.append($clone)
        }

        $tbody.show()
    }

    function populateRow($tds, x, i, rowOffset, colOffset) {
        $tds.eq(1).text(i + rowOffset + 1)
        for (var y = x[i], j = 0; j < y.length; ++j) {
            $tds.eq(j + colOffset).text($.trim(y[j]))
        }
    }

    function PopulateByEditorData($resultTable) {
        var data = $.trim($.getEditorText())
        if (data === "") {
            $.alertMe('There is no data populated!')
            return
        }

        populateDataToTable(data, $resultTable)
    }


    function attachCloseEvent(resultId) {
        $('#closeResult' + resultId).click(function () {
            $('#executionResultDiv' + resultId).remove()
        })
        var rid = resultId
        $('#screenShot' + rid).click(function () {
            $.screenShot(rid)
        })
    }

    $.templateSql = function (sql, oldResultId) {
        var resultId = oldResultId !== null && oldResultId >= 0 ? oldResultId : ++queryResultId
        var html = createTemplateSummaryTable(resultId)

        html += '<div id="divResult' + resultId + '" class="divResult">'
        html += '<div class="operateAreaDiv">'
        html += '<span class="opsSpan"><input type="checkbox" checked id="escapleSqlValues' + resultId + '"><label for="escapleSqlValues' + resultId + '">Escape SQL values</label></span>&nbsp;&nbsp;'
        html += '<span class="opsSpan reRunSql" id="moreRows' + resultId + '">More Rows</span>&nbsp;&nbsp;'
        html += '<span class="opsSpan reRunSql" id="evalSql' + resultId + '">Eval</span>&nbsp;&nbsp;'
        html += '<button title="Mark Rows or Cells" id="markRowsOrCells' + resultId + '"><span class="context-menu-icons context-menu-icon-mark"></span></button>'
        html += '<button title="Expand/Collapse Rows"  id="expandRows' + resultId + '"><span class="context-menu-icons context-menu-icon-expand"></span></button>'
        html += '<button title="Clone Rows" id="copyRow' + resultId + '" class="copyRow"><span class="context-menu-icons context-menu-icon-cloneRows"></span></button>'
        html += '<button title="Delete Rows" id="deleteRows' + resultId + '"><span class="context-menu-icons context-menu-icon-deleteRows"></span></button>'
        html += '<span class="opsSpan reRunSql" id="reTemplateSql' + resultId + '">Re Run</span>:'
        html += '<span class="sqlTd" id="sqlDiv' + resultId + '" contenteditable="true">' + sql + '</span>'
        html += '</div>'

        var templateVars = $.templateParse(sql)
        if (!templateVars || templateVars.length == 0) {
            $.alertMe('No template variables found')
            return
        }
        html += '<div id="collapseDiv' + resultId + `" class="collapseDiv">`
        html += createTable(resultId, templateVars)
        html += '</div>'


        html += '</div>'

        $.replaceOrPrependResult(resultId, oldResultId, html)

        $.attachExpandRowsEvent(resultId, true)
        attachCloseEvent(resultId)
        attachEvalEvent(resultId)
        attachMoreRowsEvent(resultId)
        bindReExecuteSql('#reTemplateSql' + resultId, resultId)
        attachHighlightColumnEvent(resultId)
        $.attachMarkRowsOrCellsEvent(resultId)
        attachSpreadPasteEvent(resultId)
        attachDeleteRowsEvent(resultId)
        attachCopyRowsEvent(resultId)
    }

    var attachSpreadPasteEvent = function (resultId) {
        var queryResultId = '#queryResult' + resultId
        $(document).on('paste', queryResultId + ' td[contenteditable]', function (e) {
            e.preventDefault()

            var clipboardText = $.clipboardText(e);
            populateDataToTable(clipboardText, $(queryResultId), $(this))
        })
    }

    var attachCopyRowsEvent = function (resultId) {
        var qr = '#queryResult' + resultId;

        $('#copyRow' + resultId).click(function () {
            var $resultTable = $(qr)

            $resultTable.find('tr.highlight').each(function (index, tr) {
                var $tr = $(tr)
                $tr.clone().removeClass('highlight').insertAfter($tr)
            })
            $resultTable.find('tbody tr').each(function (index, tr) {
                $(tr).find('td').eq(1).text(index + 1)
            })
        })
    }

    var attachDeleteRowsEvent = function (resultId) {
        var qr = '#queryResult' + resultId;

        $('#deleteRows' + resultId).click(function () {
            var $resultTable = $(qr)

            $resultTable.find('tr.highlight').each(function (index, tr) {
                $(tr).remove()
            })
            $resultTable.find('tbody tr').each(function (index, tr) {
                $(tr).find('td').eq(1).text(index + 1)
            })
        })
    }

    function highlightColumn($resultTable, $headTd) {
        $headTd.click(function () {
            var currentIndex = $headTd.parent('tr').find('td').index($headTd)
            $resultTable.find('tr').each(function () {
                $(this).find('td').eq(currentIndex).toggleClass('highlight')
            })
        })
    }

    var attachHighlightColumnEvent = function (resultId) {
        var $resultTable = $('#queryResult' + resultId)
        $resultTable.find('thead tr').each(function () {
            var $headTds = $(this).find('td:gt(1)')
            $headTds.each(function (index, headTd) {
                highlightColumn($resultTable, $(headTd))
            })
        })

        showHideColumns(resultId)
    }

    var showHideColumns = function (resultId) {
        var queryResultId = '#queryResult' + resultId
        $.contextMenu({
            zIndex: 10,
            selector: '#resultId' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                var $resultTable = $(queryResultId)
                if (key === 'ExportAsTsv') {
                    var csv = []
                    $resultTable.find('tr').each(function (index, tr) {
                        var csvLine = []
                        var usable = false
                        $(tr).find('td:gt(1)').each(function (index, td) {
                            var text = $(td).text()
                            if (text !== "") usable = true

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
                } else if (key === 'DeleteHighlightedColumns') {
                    DeleteHighlightedColumns($resultTable)
                } else if (key === 'NewAfterHighlightedColumns') {
                    NewBeforeHighlightedColumns($resultTable, 'right')
                } else if (key === 'NewBeforeHighlightedColumns') {
                    NewBeforeHighlightedColumns($resultTable, 'left')
                } else if (key === 'MapHighlightedColumns') {
                    MapHighlightedColumns($resultTable)
                } else if (key === 'CloneHighlightedColumns') {
                    CloneHighlightedColumns($resultTable)
                } else if (key === 'DuplicateHighlightedColumnValues') {
                    AutoIncrementHighlightedColumns($resultTable, false)
                }
            },
            items: {
                ExportAsTsv: {name: "Export As TSV To Clipboard", icon: "columns"},
                PopulateByEditorData: {name: "Populate By Editor Data", icon: "columns"},
                AutoIncrementHighlightedColumns: {name: "Auto Increment Highlighted Columns", icon: "columns"},
                CloneHighlightedColumns: {name: "Clone Highlighted Columns", icon: "columns"},
                NewBeforeHighlightedColumns: {name: "New Column Before Highlighted", icon: "columns"},
                NewAfterHighlightedColumns: {name: "New Column After Highlighted", icon: "columns"},
                DeleteHighlightedColumns: {name: "Delete Highlighted Columns", icon: "columns"},
                MapHighlightedColumns: {name: "Map Highlighted Columns", icon: "columns"},
                DuplicateHighlightedColumnValues: {name: "Duplicate Highlighted Columns Values", icon: "columns"},
            }
        })
    }
})()