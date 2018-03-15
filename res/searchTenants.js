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
            url: contextPath + "/searchDb",
            data: {searchKey: searchKey},
            success: function (content, textStatus, request) {
                var searchResult = $('.searchResult')
                var searchHtml = ''
                var hasContent = content && content.length
                $('#editorDiv').toggleClass('bottomMargin', !hasContent)
                if (hasContent) {
                    for (var j = 0; j < content.length; j++) {
                        searchHtml += '<span tid="' + content[j].MerchantId
                            + '" tcode="' + content[j].MerchantCode
                            + '" homeArea="' + content[j].HomeArea
                            + '" classifier="' + content[j].Classifier
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

    var createUrl = function () {
        var url = ''

        if (location.hostname.indexOf("test.") >= 0) {
            url += 'http://test.go.easy-hi.com'
        } else {
            if (activeHomeArea === 'south-center') {
                url += 'https://app.easy-hi.com'
            } else if (activeHomeArea === 'north-center') {
                url += 'https://appn.easy-hi.com'
            }
        }

        if (activeClassifier === 'yoga') {
            url += '/yoga-system/center/' + activeMerchantCode + '/index/vision#'
        } else if (activeClassifier === 'et') {
            url += '/et-server/center/' + activeMerchantCode + '/vision#'
        }

        return url
    }

    $('.searchResult').on('click', 'span', function () {
        $('.searchResult span').removeClass('active')
        var $this = $(this).addClass('active')

        activeMerchantId = $this.attr('tid')
        activeMerchantCode = $this.attr('tcode')
        activeHomeArea = $this.attr('homeArea')
        activeClassifier = $this.attr('classifier')
        activeMerchantName = $this.text()

        $('#tidtcodeSpan').html('&nbsp;<span title="tid" class="context-menu-icons context-menu-icon-id">' + activeMerchantId + ' </span>' +
            '&nbsp;<span title="tcode" class="context-menu-icons context-menu-icon-code">' + activeMerchantCode + '</span>' +
            '&nbsp;<span title="home area" class="context-menu-icons context-menu-icon-earth">' + activeHomeArea + '</span>' +
            '&nbsp;<span><a href="' + createUrl() + '" target="_blank">Home</a></span>')

        $('.executeQuery').prop("disabled", false)
        $.showTablesAjax(activeMerchantId)

        $('#fastEntriesDiv').show()
    })

})()