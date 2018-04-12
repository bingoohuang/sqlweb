(function () {
    $(document).on('click', 'tbody tr', function () {
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

    // refer
    // https://css-tricks.com/snippets/javascript/javascript-keycodes/
    // https://codepen.io/chriscoyier/pen/mPgoYJ
    $(document).keydown(function (event) {
        if (event.altKey) {
            if (event.keyCode >= 48 && event.keyCode <= 57) { // 0-9
                $('#closeResult' + (event.keyCode - 48)).click()
            } else if (event.keyCode >= 65 && event.keyCode <= 90) { // a-z
                $('#closeResult' + (event.keyCode - 65 + 10)).click()
            }
        }
    })


    if (multiTenants === 'false') {
        $.searchTenants('trr')
    } else {
        $('#multiTenantsDiv').show()
    }
})()
