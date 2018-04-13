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
        var $resultTable = $('#queryResult' + resultId)
        $.contextMenu({
            selector: '#resultId' + resultId,
            trigger: 'left',
            callback: function (key, options) {
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
                }
            },
            items: {
                HideHighlightedColumns: {name: "Hide Highlighted Columns", icon: "columns"},
                OnlyShowHighlightedColumns: {name: "Only Show Highlighted Columns", icon: "columns"},
                ShowAllColumns: {name: "Show All Columns", icon: "columns"}
            }
        })
    }
})()