var pathname = window.location.pathname
if (pathname.lastIndexOf("/", pathname.length - 1) !== -1) {
    pathname = pathname.substring(0, pathname.length - 1)
}


var activeMerchantId = null
var activeMerchantCode = null
var activeHomeArea = null
var activeMerchantName = null

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