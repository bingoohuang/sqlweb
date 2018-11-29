(function () {
    $.exportDb = function () {
        $.contextMenu({
            zIndex: 10,
            selector: 'span.activeMerchantCode',
            callback: function (key, options) {
                var tid = activeMerchantId
                var tcode = activeMerchantCode
                var homeArea = activeHomeArea
                var classifier = activeClassifier
                var tname = activeMerchantName

                if (key === 'ExportDb') {
                    exportDb(tid, tcode, homeArea, classifier, tname)
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
            error:function (jqAjaxOptions, jqXHR, textStatus, errorThrown) {
                $.alertMe(jqAjaxOptions.responseText)
            }
        }).click()
    }

    function exportDb(tid, tcode, homeArea, classifier, tname) {
        window.open(contextPath + '/exportDatabase?tid=' + tid, '_blank')
    }


})()
