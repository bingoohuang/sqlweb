(function () {
    $('#closeScreenShot').click(function () {
        $('#screenShot').hide()
    })

    function executeScreenShot(resultId) {
        $('#collapseDiv' + resultId).removeClass('collapseDiv')
        html2canvas($('#queryResult' + resultId)[0]).then(function (canvas) {
            $('#screenShot').show()
            $('#screenShotCanvas').html($(canvas))
        })
    }

    $.screenShot = function (resultId) {
        if (typeof html2canvas == "undefined") {
            $.getScript("https://cdn.bootcss.com/html2canvas/0.5.0-beta4/html2canvas.min.js")
                .done(function (script, textStatus) {
                    executeScreenShot(resultId)
                })
        } else {
            executeScreenShot(resultId)
        }

    }
})()

