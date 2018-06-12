(function () {
    function replaceTcodeTid(val) {
        val = val.replace(/\{tcode\}/g, activeMerchantCode)
        val = val.replace(/\{tid\}/g, activeMerchantId)
        return val
    }

    $.createFastEntries = function (fastEntriesConfig) {
        var fastEntriesHtml = ''

        $.each(fastEntriesConfig, function (key, entry) {
            if (fastEntriesHtml !== '') {
                fastEntriesHtml += '<span class="separator">|</span>'
            }

            var separator = entry.separator || ','
            var entryTypes = entry.type.split(separator)
            var size = entryTypes.length
            var placeholders = (entry.placeholder || '').split(separator)
            var defaultValues = (entry.defaultValue || '').split(separator)
            var inputWidth = (entry.width || '').split(separator)

            for (var i = 0; i < size; ++i) {
                var entryType = entryTypes[i]
                if (entryType === 'input') {
                    if (i === 0) {
                        fastEntriesHtml += '<span><span class="' +
                            (entry.autoHide ? "authHidable underline" : "") + '" >' + entry.label + '</span>' +
                            '<span class="' + (entry.autoHide ? "hide" : "") + '">: '
                    }

                    var width = inputWidth && (inputWidth[i] || inputWidth[0])

                    if (i === size - 1) {
                        fastEntriesHtml += '<input inputsize="' + size + '" ' +
                            (width ? 'style="width:' + width + '" ' : '') +
                            'placeholder="' + (placeholders[i] || '') + '" value="' + (defaultValues[i] || '') + '" ' +
                            'entryKey="' + key + '"></span></span>'
                    } else {
                        fastEntriesHtml += '<input ' +
                            (width ? 'style="width:' + width + '" ' : '') +
                            'placeholder="' + (placeholders[i] || '') + '" value="' + (defaultValues[i] || '') + '" ' +
                            '>'
                    }
                } else if (entryType = 'link') {
                    fastEntriesHtml += '<span class="clickable" entryKey="' + key + '">' + entry.label + '</span>'
                }
            }


        })

        $('#fastEntriesDiv').html(fastEntriesHtml)

        $('#fastEntriesDiv span.authHidable').click(function () {
            var $span = $(this)
            $span.next().toggle()
            $span.toggleClass('underline')
        })

        $('#fastEntriesDiv input').keydown(function (event) {
            var keyCode = event.keyCode || event.which
            if (keyCode == 13) {
                var entryKey = $(this).attr('entryKey')
                if (!entryKey) return

                var fastEntry = fastEntriesConfig[entryKey]
                var separator = fastEntry.separator || ','
                var inputsize = $(this).attr('inputsize')
                if (inputsize === "1") {
                    var input = $(this).val()

                    if (fastEntry.sql) {
                        var sql = fastEntry.sql.replace(/\{input\}/g, input)

                        $.executeMultiSqlsAjax(replaceTcodeTid(sql), true)
                    } else if (fastEntry.action) {
                        var action = fastEntry.action.replace(/\{input\}/g, input)
                        executeFastAction(replaceTcodeTid(action), separator)
                    }
                } else {
                    var $input = $(this)
                    var sql = fastEntry.sql
                    var action = fastEntry.action

                    for (var i = +inputsize; i >= 0; --i) {
                        var input = $input.val()

                        var p = new RegExp("\\{input" + i + "\\}", "g")
                        if (sql) {
                            sql = sql.replace(p, input)
                        } else if (action) {
                            action = action.replace(p, input)
                        }
                        $input = $input.prev('input')
                    }

                    if (sql) {
                        $.executeMultiSqlsAjax(replaceTcodeTid(sql), true)
                    } else if (action) {
                        executeFastAction(replaceTcodeTid(action), separator)
                    }
                }
            }
        }).focus(function () {
            $(this).select()
        })

        $('#fastEntriesDiv span.clickable').click(function () {
            var entryKey = $(this).attr('entryKey')
            var fastEntry = fastEntriesConfig[entryKey]
            var separator = fastEntry.separator || ','
            if (fastEntry.sql) {
                $.executeMultiSqlsAjax(replaceTcodeTid(fastEntry.sql))
            }
            if (fastEntry.action) {
                executeFastAction(replaceTcodeTid(fastEntry.action), separator)
            }
        })
    }

    function executeFastAction(action, separator) {
        var params = action.split(separator || ',')
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