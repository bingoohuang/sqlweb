(function () {
    $('.searchKey').keydown(function (event) {
        var keyCode = event.keyCode || event.which
        if (keyCode == 13) searchTenants()
    }).focus(function () {
        $(this).select()
    })

    function searchTenants() {
        $('.tablesWrapper').hide()
        $('#fastEntriesDiv').hide()

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
                            + '" class="context-menu-icons context-menu-icon-tenant">' + content[j].MerchantName + '</span>'
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
    }

    $('.searchResult').on('click', 'span', function () {
        $('.searchResult span').removeClass('active')
        var $this = $(this).addClass('active')

        activeMerchantId = $this.attr('tid')
        activeMerchantCode = $this.attr('tcode')
        activeHomeArea = $this.attr('homeArea')
        activeMerchantName = $this.text()

        $('#tidtcodeSpan').html('<span title="tid" class="context-menu-icons context-menu-icon-id">' + activeMerchantId + ' </span>' +
            '<span title="tcode" class="context-menu-icons context-menu-icon-code">' + activeMerchantCode + '</span>' +
            '<span title="home area" class="context-menu-icons context-menu-icon-earth">' + activeHomeArea + '</span>')

        $('.executeQuery').prop("disabled", false)
        $.showTablesAjax(activeMerchantId)

        $('#fastEntriesDiv').show()
    })

})()