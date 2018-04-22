(function () {
    $.createFastEntries = function (fastEntriesConfig) {
        var fastEnriesHtml = ''

        $.each(fastEntriesConfig, function (key, entry) {
            if (fastEnriesHtml !== '') {
                fastEnriesHtml += '<span class="separator">|</span>'
            }

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
                var fastEntry = fastEntriesConfig[entryKey]

                if (fastEntry.sql) {
                    var sql = fastEntry.sql.replace(/\{input\}/g, input)
                    $.executeMultiSqlsAjax(sql)
                }

                if (fastEntry.action) {
                    var action = fastEntry.action.replace(/\{input\}/g, input)
                    executeFastAction(action)
                }
            }
        }).focus(function () {
            $(this).select()
        })

        $('#fastEntriesDiv span.clickable').click(function () {
            var entryKey = $(this).attr('entryKey')
            var fastEntry = fastEntriesConfig[entryKey];
            if (fastEntry.sql) {
                $.executeMultiSqlsAjax(fastEntry.sql)
            }
        })
    }

    function executeFastAction(action) {
        var params = action.split(',')
        var paramObject = {tid: activeMerchantId}
        for (var i = 0; i < params.length; ++i) {
            var kv = params[i].split('=', 2)
            paramObject[kv[0]] = kv[1]
        }

        $.ajax({
            type: 'POST',
            url: contextPath + "/action",
            data: paramObject,
            success: function (content, textStatus, request) {
                alert("OK: " + content)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }
})()