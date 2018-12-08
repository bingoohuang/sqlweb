(function () {
    $.attachMarkRowsOrCellsEvent = function (resultId) {
        $('#markRowsOrCells' + resultId)
            .click(function () {
                var table = $('#queryResult' + resultId)
                if (table.attr('markRowsOrCells')) {
                    table.off('click.markRowsOrCells', 'tbody tr')
                    table.removeAttr('markRowsOrCells')
                    $(this).find('span').removeClass('context-menu-icon-markenabled').addClass('context-menu-icon-mark')
                    table.find('tr.highlight').removeClass('highlight')

                    return
                }

                table.attr('markRowsOrCells', 'enabled')
                $(this).find('span').removeClass('context-menu-icon-mark').addClass('context-menu-icon-markenabled')

                table.on('click.markRowsOrCells', 'tbody tr', function () {
                    $(this).toggleClass('highlight')
                })
            })
            .dblclick(function () {
                var table = $('#queryResult' + resultId)
                table.attr('markRowsOrCells', 'enabled')
                $.chosenRowsHighlightedOrAll(resultId).each(function (index, tr) {
                    var $tr = $(tr)
                    $tr.addClass('highlight')
                })
            })
    }
})()