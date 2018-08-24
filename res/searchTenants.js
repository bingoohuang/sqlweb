(function () {
    $('.searchKey').keydown(function (event) {
        var keyCode = event.keyCode || event.which
        if (keyCode == 13) {
            $('.tablesWrapper').hide()
            $('#fastEntriesDiv').hide()

            $('#tidtcodeSpan').text('')
            var searchKey = $.trim($('.searchKey').val())
            if (searchKey === '') {
                $.alertMe("please input tid/tcode/tname")
                return
            }
            $.searchTenants(searchKey)
        }
    }).focus(function () {
        $(this).select()
    })

    $.searchTenants = function (searchKey, callbackFn, byTenant) {
        $.ajax({
            type: 'POST',
            url: contextPath + "/searchDb",
            data: {searchKey: searchKey, byTenant: !!byTenant},
            success: function (content, textStatus, request) {
                var searchResult = $('.searchResult')
                var searchHtml = ''
                var hasContent = content && content.length
                if (hasContent) {
                    searchHtml += `<option value="trr|trr|south-center|trr|trr|trr|trr" selected="selected">trr</option>`
                    for (var j = 0; j < content.length; j++) {
                        const {MerchantId, MerchantCode, HomeArea, Classifier, MerchantName} = content[j]
                        // activeMerchantId|activeMerchantCode|activeHomeArea|activeClassifier|activeMerchantName|activeMerchantNamePinyin|activeMerchantNameSimplePinyin
                        searchHtml += `<option value="${MerchantId
                        + '|' + MerchantCode
                        + '|' + HomeArea
                        + '|' + Classifier
                        + '|' + MerchantName
                        + '|' + $.toPinyin(MerchantName)
                        + '|' + $.simplePinyin(MerchantName)}">${MerchantName}</option>`
                    }
                    $('.searchResult').select2({matcher: matcherCustom});
                    $('.searchResult').on('select2:select', function (e) {
                        selectDB(e.params.data.id)
                    });
                    $('.searchResult').on('select2:open', function (e) {
                        $('.select2-search__field').attr('placeholder', 'tid|tcode|名称|缩写|全拼|HomeArea')
                    });

                    $.exportDb()
                } else {
                    $('.executeQuery').prop("disabled", true)
                    $('.tables').html('')
                }
                searchResult.html(searchHtml)
                if (content.length > 0) {
                    selectDB($('.searchResult').select2('data')[0].id)
                    // const {MerchantId, MerchantCode, HomeArea, Classifier, MerchantName} = content[0]
                    // selectDB(`${MerchantId + '|' + MerchantCode + '|' + HomeArea + '|' + Classifier + '|' + MerchantName}`)
                }
                callbackFn && callbackFn()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    if (multiTenants === 'false') {
        $.searchTenants('trr')
    } else {
        $('#multiTenantsDiv').show()
        if (defaultTenant) {
            $.searchTenants(defaultTenant, function () {
                tableApp.initTable()
            })
        }
    }

    function selectDB(data) {
        if (!data) return

        const arr = data.split('|')
        activeMerchantId = arr[0]
        activeMerchantCode = arr[1]
        activeHomeArea = arr[2]
        activeClassifier = arr[3]
        activeMerchantName = arr[4]


        $('#tidtcodeSpan').html('　<span title="tid" class="context-menu-icons context-menu-icon-id" onclick="prompt(\'tid:\', \'' + activeMerchantId + '\')"></span>' +
            '　<span>' + activeClassifier + '</span>' +
            '　<span title="tcode" class="context-menu-icons context-menu-icon-code">' + activeMerchantCode + '</span>' +
            '　<span title="home area" class="context-menu-icons context-menu-icon-earth">' + activeHomeArea + '</span>')

        $('.executeQuery').prop("disabled", false)
        tableApp.initTable()

        $.refreshLinksConfig()

        $('#fastEntriesDiv').show()
    }

    function matcherCustom(params, data) {
        const queryStr = $.trim(params.term).toLowerCase()
        if (queryStr === '') return data
        if (data.id.toLowerCase().indexOf(queryStr) >= 0) return data
        return null
    }

})()