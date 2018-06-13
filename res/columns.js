(function () {
    $.attachHighlightColumnEvent = function (resultId) {
        var $resultTable = $('#queryResult' + resultId)
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').click(function () {
                var currentIndex = -1
                var currentTd = this;
                $(this).parent('tr').find('td').each(function (index, td) {
                    if (td === currentTd) {
                        currentIndex = index
                        return false
                    }
                })

                $resultTable.find('tr').each(function () {
                    $(this).find('td').eq(currentIndex).toggleClass('highlight')
                })
            })
        })

        showHideColumns(resultId)
    }

    function HideHighlightedColumns($resultTable) {
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').each(function (index, td) {
                if ($(td).hasClass('highlight')) {
                    $resultTable.find('tr').each(function () {
                        $(this).find('td').eq(index).addClass('hide').removeClass('highlight')
                    })
                }
            })
        })
    }

    function OnlyShowHighlightedColumns($resultTable) {
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').each(function (index, td) {
                if (!$(td).hasClass('highlight')) {
                    $resultTable.find('tr').each(function () {
                        $(this).find('td').eq(index).addClass('hide')
                    })
                } else {
                    $resultTable.find('tr').each(function () {
                        $(this).find('td').eq(index).removeClass('highlight')
                    })
                }
            })
        })
    }

    function CopyHighlightedColumnsAsTsv($resultTable) {
        var csv = []
        $resultTable.find('tr:visible').each(function (index, tr) {
            var csvLine = []
            $(tr).find('td').each(function (index, td) {
                if (index == 0) return

                var $td = $(td)
                if ($td.hasClass('highlight')) {
                    csvLine.push($.csvString($td.text()))
                }
            })
            csv.push(csvLine.join('\t'))
        })
        $.copyTextToClipboard(csv.join('\n'))
        $.copiedTips('TSV copied.')
    }

    function CopyAsTsv($resultTable) {
        var csv = []
        $resultTable.find('tr:visible').each(function (index, tr) {
            var csvLine = []
            $(tr).find('td').each(function (index, td) {
                if (index == 0) return

                var $td = $(td)
                if (!$td.hasClass('hide')) {
                    csvLine.push($.csvString($td.text()))
                }
            })
            csv.push(csvLine.join('\t'))
        })
        $.copyTextToClipboard(csv.join('\n'))
        $.copiedTips('TSV copied.')
    }

    var FilterAndOrderHighlightedColumn = function ($resultTable) {
        var specifiedValues = $.sqlCodeMirror.getValue()
        var lines = specifiedValues.split('\n')
        var filteredLines = []
        var filteredValues = {}
        for (var i = 0; i < lines.length; ++i) {
            var lineValue = $.trim(lines[i])
            if (lineValue.length > 0 && !filteredValues[lineValue]) {
                filteredLines.push(lineValue)
                filteredValues[lineValue] = filteredLines.length
            }
        }


        var compareColumnIndex = -1
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').each(function (index, td) {
                if ($(td).hasClass('highlight')) {
                    compareColumnIndex = index
                    return false // break
                }
            })
        })

        if (compareColumnIndex < 0) {
            alert("No column highlighted!")
            return
        }

        if (filteredLines.length == 0) {
            alert("No Values Specified!")
            return
        }

        $.filterSortTableByValues($resultTable, compareColumnIndex, filteredValues)
    }

    var showHideColumns = function (resultId) {
        var queryResultId = '#queryResult' + resultId

        $.contextMenu({
            zIndex: 10,
            selector: '#resultId' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                var $resultTable = $(queryResultId)

                if (key === 'HideHighlightedColumns') {
                    HideHighlightedColumns($resultTable)
                } else if (key === 'OnlyShowHighlightedColumns') {
                    OnlyShowHighlightedColumns($resultTable)
                } else if (key === 'ShowAllColumns') {
                    $resultTable.find('td').removeClass('hide').removeClass('highlight')
                } else if (key === 'CopyHighlightedColumnsAsTsv') {
                    CopyHighlightedColumnsAsTsv($resultTable)
                } else if (key === 'CopyAsTsv') {
                    CopyAsTsv($resultTable)
                } else if (key === 'MakeDraggable') {
                    dragtable.makeDraggable($resultTable[0])
                } else if (key === 'FilterAndOrderHighlightedColumn') {
                    FilterAndOrderHighlightedColumn($resultTable)
                }
            },
            items: {
                HideHighlightedColumns: {name: "Hide Highlighted Columns", icon: "columns"},
                OnlyShowHighlightedColumns: {name: "Only Show Highlighted Columns", icon: "columns"},
                ShowAllColumns: {name: "Show All Columns", icon: "columns"},
                CopyHighlightedColumnsAsTsv: {name: "Copy Highlighted Columns As TSV To Clipboard", icon: "columns"},
                CopyAsTsv: {name: "Copy As TSV To Clipboard", icon: "columns"},
                MakeDraggable: {name: "Make Draggable", icon: "columns"},
                FilterAndOrderHighlightedColumn: {
                    name: "Filter And Order Highlighted Column By Specified Values",
                    icon: "columns"
                }
            }
        })
    }
})()