/**
 * 2012, ParkMe Inc. - Keith Hackbarth
 *
 **/

(function ($) {
    $.fn.loading = function () {

        // create loading element
        var loadingElement = document.createElement('div')
        loadingElement.id = 'loading'
        loadingElement.className = 'loading'
        loadingElement.innerHTML = 'Loading...(0s)'

        // apply styles
        loadingElement.style.position = 'fixed'
        loadingElement.style.background = 'yellow'
        loadingElement.style.width = '130px'
        loadingElement.style.textAlign = 'center'
        loadingElement.style.zIndex = '10000'
        loadingElement.style.padding = '4px'
        loadingElement.style.border = 'grey solid 1px'
        loadingElement.style.display = 'none'

        // attach it to DOM
        $(this).append(loadingElement)

        // position element
        $("#loading").position({
            my: "center top",
            at: "center top",
            of: window
        })

        var intervalFn = null
        var countSeconds = 0

        // every time ajax is called
        $(document).ajaxSend(function () {
            $(loadingElement).html('Loading...').show()
            intervalFn = setInterval(function () {
                $(loadingElement).html('Loading(' + ++countSeconds + 's)...')
            }, 1000)
        })

        // every time ajax is completed
        $(document).ajaxComplete(function () {
            $(loadingElement).hide()
            clearInterval(intervalFn)
            intervalFn = null
            countSeconds = 0
        })
    }

})(jQuery);

$(document).ready(function () {
    $('body').loading()
})

