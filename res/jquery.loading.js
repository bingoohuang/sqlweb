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

        var $loadingElement = $(loadingElement)

        // every time ajax is called
        $(document)
            .ajaxSend(function (event, jqxhr, settings) {
                $loadingElement.html('Loading...').show()
                var countSeconds = 0
                settings.intervalFn = setInterval(function () {
                    $(loadingElement).html('Loading(' + ++countSeconds + 's)...')
                }, 1000)
            })
            .ajaxComplete(function (event, jqxhr, settings) {
                $loadingElement.hide()
                clearInterval(settings.intervalFn)
                settings.intervalFn = null
            })
    }

})(jQuery)

$(document).ready(function () {
    $('body').loading()
})

