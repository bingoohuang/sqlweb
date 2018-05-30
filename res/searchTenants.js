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

    var createHomeUrl = function () {
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

    $.copyWxAuthUrl = function () {
        var url = ''

        // https://app.easy-hi.com/yoga-boss-ssp/wx-auth/wxAuth?merchantId=6b967b95-c289-478a-a48b-3c04c012d8d5&from=1
        // https://app.easy-hi.com/yoga-boss-ssp/wx-auth/wxAuth?merchantId=c67242fe-5a73-41af-b06b-e2e3e9d21ca5&from=1&classifier=et
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
            url += '/yoga-boss-ssp/wx-auth/wxAuth?merchantId=' + activeMerchantId + '&from=1'
        } else if (activeClassifier === 'et') {
            url += '/yoga-boss-ssp/wx-auth/wxAuth?merchantId=' + activeMerchantId + '&from=1&classifier=et'
        }

        $.copyTextToClipboard(url)
        $.copiedTips(url)
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
            '　<span title="home area" class="context-menu-icons context-menu-icon-earth">' + activeHomeArea + '</span>' +
            '　<span><a href="' + createHomeUrl() + '" target="_blank">Home</a></span>' +
            '　<span><a href="javascript:void(0)" onclick="$.copyWxAuthUrl()">WxAuth</a></span>')

        $('.executeQuery').prop("disabled", false)
        $.showTablesAjax(activeMerchantId)

        $('#fastEntriesDiv').show()
    })

})()