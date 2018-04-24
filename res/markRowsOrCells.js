(function () {
    $.attachMarkRowsOrCellsEvent = function (resultId) {
        $('#markRowsOrCells' + resultId).click(function () {
            var table = $('#queryResult' + resultId)
            if (table.attr('markRowsOrCells')) {
                table.off('click.markRowsOrCells', 'tbody tr')
                    .off('dblclick.markRowsOrCells', 'tbody td')
                table.removeAttr('markRowsOrCells')
                $(this).find('span').removeClass('context-menu-icon-markenabled').addClass('context-menu-icon-mark')
                return
            }

            table.attr('markRowsOrCells', 'enabled')
            $(this).find('span').removeClass('context-menu-icon-mark').addClass('context-menu-icon-markenabled')

            table
                .on('click.markRowsOrCells', 'tbody tr', function () {
                    var row = $(this)

                    if (row.hasClass('highlight')) {
                        row.removeClass('highlight')
                        if (row.attr('rowOdd') === 'true') {
                            row.addClass('rowOdd')
                        }
                    } else {
                        if (row.attr('rowOdd') === 'true') {
                            row.removeClass('rowOdd')
                        }
                        row.addClass('highlight')
                    }
                })
                .on('dblclick.markRowsOrCells', 'tbody td', function (e) {
                    e.preventDefault()
                    var hasClass = $(this).hasClass('highlightCell')
                    $('table td.highlightCell').removeClass('highlightCell')
                    if (!hasClass) {
                        var cellValue = $(this).text()
                        if (cellValue === '') return

                        $('table td').each(function (index, tmarkRowsOrCellsd) {
                            if ($(td).text() === cellValue) {
                                $(this).addClass('highlightCell')
                            }
                        })
                    }
                })

        })
    }
})()