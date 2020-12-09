(function () {
    $.exportDbImpl = function (tid, tcode, homeArea, classifier, tname, tables) {
        window.open(contextPath + '/exportDatabase?tid=' + tid + "&tables=" + tables, '_blank')
    }

    $.exportDb = function () {
        $.contextMenu({
            zIndex: 10,
            selector: 'span.activeMerchantCode',
            callback: function (key, options) {
                const tid = activeMerchantId
                const tcode = activeMerchantCode
                const homeArea = activeHomeArea
                const classifier = activeClassifier
                const tname = activeMerchantName

                if (key === 'ExportDb') {
                    $.exportDbImpl(tid, tcode, homeArea, classifier, tname, '')
                } else if (key === 'ImportDb') {
                    importDb(tid, tcode, homeArea, classifier, tname)
                }
            },
            items: {
                ExportDb: {name: 'Export Database', icon: 'exportdb'},
                ImportDb: {name: 'Import Database', icon: 'importdb'}
            }
        })
    }


    function importDb(tid, tcode, homeArea, classifier, tname) {
        $('#file').uploader({
            url: contextPath + "/importDatabase",
            dataType: 'json',
            method: 'POST',
            data: {tcode: tcode},
            done: function (e, data) {
                $.alertMe('导入完成')
            },
            error: function (jqAjaxOptions, jqXHR, textStatus, errorThrown) {
                $.alertMe(jqAjaxOptions.responseText)
            }
        }).click()
    }
})()
