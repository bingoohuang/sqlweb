var queryResultId = -1
var activeMerchantId = null
var activeMerchantCode = null
var activeHomeArea = null
var activeMerchantName = null
var activeClassifier = null

;

(function () {
    $('.clearResult').click(function () {
        $('.result').html('')
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
})()
