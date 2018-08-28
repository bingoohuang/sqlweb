(function () {
    $.attachHighlightColumnEvent = function (resultId) {
        var $resultTable = $('#queryResult' + resultId)
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').click(function () {
                var currentTd = $(this);

                if (currentTd.hasClass('highlight')) {
                    currentTd.css({"background-color": currentTd.attr('old-background-color')})
                    currentTd.removeAttr('old-background-color')
                } else {
                    currentTd.attr('old-background-color', currentTd.css("background-color"))
                    currentTd.css({"background-color": "rgba(20, 255, 20, .5)"})
                }

                var highlightIndex = $(this).parent('tr').find('td').index(currentTd)
                $resultTable.find('tr').each(function () {
                    $(this).find('td').eq(highlightIndex).toggleClass('highlight')
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
    }

    $.findFirstHighlightedColumnIndex = function ($resultTable) {
        var compareColumnIndex = -1
        $resultTable.find('thead tr').eq(0).find('td').each(function (index, td) {
            if ($(td).hasClass('highlight')) {
                compareColumnIndex = index
                return false // break
            }
        })

        return compareColumnIndex
    }


    $.findHighlightedColumnIndexes = function ($resultTable) {
        var highlightedColumnIndexes = []
        $resultTable.find('thead tr').eq(0).find('td').each(function (index, td) {
            if ($(td).hasClass('highlight')) {
                highlightedColumnIndexes.push(index)
            }
        })

        return highlightedColumnIndexes
    }

    var FilterAndOrderHighlightedColumn = function ($resultTable) {
        var lines = $.getEditorText().split('\n')
        var filteredLines = []
        var filteredValues = {}

        var dupliates = []
        for (var i = 0; i < lines.length; ++i) {
            var lineValue = $.trim(lines[i])
            if (lineValue.length === 0) continue;

            if (filteredValues[lineValue]) {
                dupliates.push(lineValue)
            } else {
                filteredLines.push(lineValue)
                filteredValues[lineValue] = filteredLines.length
            }
        }

        if (dupliates.length > 0) {
            $.appendSqlToSqlEditor("\n\nDuplicated:\n" + dupliates.join('\n'), true, true)
            $.alertMe(dupliates.length + " duplicated items found!")
        }

        var compareColumnIndex = $.findFirstHighlightedColumnIndex($resultTable)
        if (compareColumnIndex < 0) {
            $.alertMe("No column highlighted!")
            return
        }

        if (filteredLines.length == 0) {
            $.alertMe("No Values Specified!")
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
                    // http://www.danvk.org/wp/dragtable/index.html
                    dragtable.makeDraggable($resultTable[0])
                } else if (key === 'FilterAndOrderHighlightedColumn') {
                    FilterAndOrderHighlightedColumn($resultTable)
                }
            },
            items: {
                HideHighlightedColumns: {name: "Hide Highlighted Columns", icon: "columns"},
                OnlyShowHighlightedColumns: {name: "Only Show Highlighted Columns", icon: "columns"},
                ShowAllColumns: {name: "Show All Columns", icon: "columns"},
                CopyHighlightedColumnsAsTsv: {name: "Copy Highlighted Columns As TSV", icon: "columns"},
                CopyAsTsv: {name: "Copy As TSV", icon: "columns"},
                MakeDraggable: {name: "Make Draggable", icon: "columns"},
                FilterAndOrderHighlightedColumn: {
                    name: "Filter And Order Highlighted Column By Specified Values",
                    icon: "columns"
                }
            }
        })
    }
})()