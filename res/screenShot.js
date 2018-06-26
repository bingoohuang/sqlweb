(function () {
    $('#closeScreenShot').click(function () {
        $('#screenShot').hide()
    })


    $.screenShot = function (resultId) {
        $('#collapseDiv' + resultId).removeClass('collapseDiv')
        html2canvas($('#queryResult' + resultId)[0]).then(canvas => {
            $('#screenShot').show()
            $('#screenShotCanvas').html($(canvas))
        })
    }
})()

