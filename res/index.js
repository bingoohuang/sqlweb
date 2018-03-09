(function () {
    $(document).on('click', 'tbody tr', function () {
        var row = $(this)

        if (row.hasClass('highlightRow')) {
            row.removeClass('highlightRow')
            if (row.attr('rowOdd') === 'true') {
                row.addClass('rowOdd')
            }
        } else {
            if (row.attr('rowOdd') === 'true') {
                row.removeClass('rowOdd')
            }
            row.addClass('highlightRow')
        }
    })
})()
