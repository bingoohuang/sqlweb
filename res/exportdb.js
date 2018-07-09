(function () {
    $.exportDb = function () {
        $.contextMenu({
            zIndex: 10,
            selector: '.searchResult span',
            callback: function (key, options) {
                var $this = $(this)
                var tid = $this.attr('tid')
                var tcode = $this.attr('tcode')
                var homeArea = $this.attr('homeArea')
                var classifier = $this.attr('classifier')
                var tname = $this.text()
                // alert(tid + ',' + tcode + ',' + homeArea + ',' + classifier + ',' + tname)

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
                alert('导入完成')
            },
            error:function (jqAjaxOptions, jqXHR, textStatus, errorThrown) {
                alert(jqAjaxOptions.responseText)
            }
        }).click()
    }

    function exportDb(tid, tcode, homeArea, classifier, tname) {
        window.open(contextPath + '/exportDatabase?tid=' + tid, '_blank')
    }


})()
