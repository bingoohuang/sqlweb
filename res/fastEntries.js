(function () {
    $.createFastEntries = function (fastEntriesConfig) {
        var fastEnriesHtml = ''

        $.each(fastEntriesConfig, function (key, entry) {
            if (entry.type === 'input') {
                fastEnriesHtml += '<span>' + entry.label + ': <input placeholder="' + (entry.placeholder || '') + '" entryKey="' + key + '"></span>'
            } else if (entry.type = 'link') {
                fastEnriesHtml += '<span class="clickable" entryKey="' + key + '">' + entry.label + '</span>'
            }
        })

        $('#fastEntriesDiv').html(fastEnriesHtml)

        $('#fastEntriesDiv input').keydown(function (event) {
            var keyCode = event.keyCode || event.which
            if (keyCode == 13) {
                var input = $(this).val()
                var entryKey = $(this).attr('entryKey')
                var sqlTemplate = fastEntriesConfig[entryKey].sql
                var sql = sqlTemplate.replace(/\{input\}/g, input)
                $.executeQueryAjax(sql)
            }
        }).focus(function () {
            $(this).select()
        })

        $('#fastEntriesDiv span.clickable').click(function () {
            var entryKey = $(this).attr('entryKey')
            var sql = fastEntriesConfig[entryKey].sql
            $.executeQueryAjax(sql)
        })
    }
})()