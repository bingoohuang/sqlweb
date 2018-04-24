var queryResultId = -1
var activeMerchantId = null
var activeMerchantCode = null
var activeHomeArea = null
var activeMerchantName = null
var activeClassifier = null
;

(function () {
    $(document).on('paste', '[contenteditable]', function (e) {
        e.preventDefault()
        var text = ''
        if (e.clipboardData || e.originalEvent.clipboardData) {
            text = (e.originalEvent || e).clipboardData.getData('text/plain')
        } else if (window.clipboardData) {
            text = window.clipboardData.getData('Text')
        }
        if (document.queryCommandSupported('insertText')) {
            document.execCommand('insertText', false, text)
        } else {
            document.execCommand('paste', false, text)
        }
    })

    $('.clearResult').click(function () {
        $('.result').html('')
        queryResultId = -1
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
