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

    var showHideColumns = function (resultId) {
        var queryResultId = '#queryResult' + resultId;
        $.contextMenu({
            selector: '#resultId' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                var $resultTable = $(queryResultId)
                
                if (key === 'HideHighlightedColumns') {
                    $resultTable.find('thead tr').each(function () {
                        $(this).find('td').each(function (index, td) {
                            if ($(td).hasClass('highlight')) {
                                $resultTable.find('tr').each(function () {
                                    $(this).find('td').eq(index).addClass('hide').removeClass('highlight')
                                })
                            }
                        })
                    })
                } else if (key === 'OnlyShowHighlightedColumns') {
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
                } else if (key === 'ShowAllColumns') {
                    $resultTable.find('td').removeClass('hide').removeClass('highlight')
                } else if (key === 'ExportAsTsv') {
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
            },
            items: {
                HideHighlightedColumns: {name: "Hide Highlighted Columns", icon: "columns"},
                OnlyShowHighlightedColumns: {name: "Only Show Highlighted Columns", icon: "columns"},
                ShowAllColumns: {name: "Show All Columns", icon: "columns"},
                ExportAsTsv: {name: "Export As TSV To Clipboard", icon: "columns"}
            }
        })
    }
})()