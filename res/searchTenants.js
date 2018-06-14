(function () {
    $('.searchKey').keydown(function (event) {
        var keyCode = event.keyCode || event.which
        if (keyCode == 13) {
            $('.tablesWrapper').hide()
            $('#fastEntriesDiv').hide()

            $('#tidtcodeSpan').text('')
            var searchKey = $.trim($('.searchKey').val())
            if (searchKey === '') {
                alert("please input tid/tcode/tname")
                return
            }
            $.searchTenants(searchKey)
        }
    }).focus(function () {
        $(this).select()
    })

    $.searchTenants = function (searchKey) {
        $.ajax({
            type: 'POST',
            url: contextPath + "/searchDb",
            data: {searchKey: searchKey},
            success: function (content, textStatus, request) {
                var searchResult = $('.searchResult')
                var searchHtml = ''
                var hasContent = content && content.length
                if (hasContent) {
                    for (var j = 0; j < content.length; j++) {
                        searchHtml += '<span tid="' + content[j].MerchantId
                            + '" tcode="' + content[j].MerchantCode
                            + '" homeArea="' + content[j].HomeArea
                            + '" classifier="' + content[j].Classifier
                            + '" class="context-menu-icons context-menu-icon-tenant">' + content[j].MerchantName + '</span>'
                    }

                    $.exportDb()
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

    if (multiTenants === 'false') {
        $.searchTenants('trr')
    } else {
        $('#multiTenantsDiv').show()
    }

    $('.searchResult').on('click', 'span', function () {
        $('.searchResult span').removeClass('active')
        var $this = $(this).addClass('active')

        activeMerchantId = $this.attr('tid')
        activeMerchantCode = $this.attr('tcode')
        activeHomeArea = $this.attr('homeArea')
        activeClassifier = $this.attr('classifier')
        activeMerchantName = $this.text()

        $('#tidtcodeSpan').html('　<span title="tid" class="context-menu-icons context-menu-icon-id" onclick="prompt(\'tid:\', \'' + activeMerchantId + '\')"></span>' +
            '　<span title="tcode" class="context-menu-icons context-menu-icon-code">' + activeMerchantCode + '</span>' +
            '　<span title="home area" class="context-menu-icons context-menu-icon-earth">' + activeHomeArea + '</span>')

        $('.executeQuery').prop("disabled", false)
        $.showTablesAjax(activeMerchantId)

        $('#fastEntriesDiv').show()
    })

})()