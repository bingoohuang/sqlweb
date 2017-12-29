(function () {
    $('.searchKey').keydown(function (event) {
        var keyCode = event.keyCode || event.which
        if (keyCode == 13) $('.searchButton').click()
    }).focus(function () {
        $(this).select()
    })

    $('.searchButton').click(function () {
        $.hideTablesDiv()
        $('#tidtcodeSpan').text('')
        var searchKey = $.trim($('.searchKey').val())
        if (searchKey === '') {
            alert("please input tid/tcode/tname")
            return
        }

        $.ajax({
            type: 'POST',
            url: pathname + "/searchDb",
            data: {searchKey: searchKey},
            success: function (content, textStatus, request) {
                var searchResult = $('.searchResult')
                var searchHtml = ''
                if (content && content.length) {
                    for (var j = 0; j < content.length; j++) {
                        searchHtml += '<span tid="' + content[j].MerchantId
                            + '" tcode="' + content[j].MerchantCode
                            + '" homeArea="' + content[j].HomeArea
                            + '">🌀' + content[j].MerchantName + '</span>'
                    }
                } else {
                    $('.executeQuery').prop("disabled", true)
                    $('.tables').html('')
                }
                searchResult.html(searchHtml)
                $('.searchResult span:first-child').click()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })


    $('.searchResult').on('click', 'span', function () {
        $('.searchResult span').removeClass('active')
        var $this = $(this).addClass('active')

        activeMerchantId = $this.attr('tid')
        activeMerchantCode = $this.attr('tcode')
        activeHomeArea = $this.attr('homeArea')
        activeMerchantName = $this.text()

        $('#tidtcodeSpan').text('tid:' + activeMerchantId + ', tcode:' + activeMerchantCode + ', homeArea:' + activeHomeArea)

        $('.executeQuery').prop("disabled", false)
        $.showTablesAjax(activeMerchantId)
    })

})()