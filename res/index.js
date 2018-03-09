(function () {
    var lastClickedRow = null
    var lastRowOdd = false
    $(document).on('click', 'tbody tr', function () {
        if (lastClickedRow != null) {
            lastClickedRow.removeClass('highlightRow')
            if (lastRowOdd == true) {
                lastClickedRow.addClass('rowOdd')
            }
        }
        lastClickedRow = $(this)
        lastRowOdd = lastClickedRow.hasClass('rowOdd')
        if (lastRowOdd) {
            lastClickedRow.removeClass('rowOdd')
        }
        lastClickedRow.addClass('highlightRow')
    })
})()
