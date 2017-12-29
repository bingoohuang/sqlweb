var pathname = window.location.pathname
if (pathname.lastIndexOf("/", pathname.length - 1) !== -1) {
    pathname = pathname.substring(0, pathname.length - 1)
}


var activeMerchantId = null
var activeMerchantCode = null
var activeHomeArea = null
var activeMerchantName = null
