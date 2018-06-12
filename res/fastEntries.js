(function () {
    function parseTemplate(val, fastEntry, data) {
        if (fastEntry.userTemplate) {
            data.tcode = activeMerchantCode
            data.tid = activeMerchantId
            data.classifier = activeClassifier
            data.merchantName = activeMerchantName
            data.homeArea = activeHomeArea

            return template.render(val, data)
        } else {
            for (var k in data) {
                val = val.split('{' + k + '}').join(data[k])
            }

            val = val.split('{tcode}').join(activeMerchantCode)
            val = val.split('{tid}').join(activeMerchantId)
            val = val.split('{classifier}').join(activeClassifier)
            val = val.split('{merchantName}').join(activeMerchantName)
            val = val.split('{homeArea}').join(activeHomeArea)

            return val
        }
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
                } else if (entryType === 'link') {
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
                var inputsize = $(this).attr('inputsize')
                var data = {}
                if (inputsize === "1") {
                    data.input = $(this).val()
                } else {
                    var $input = $(this)
                    for (var i = +inputsize; i >= 0; --i) {
                        data["input" + i] = $input.val()
                        $input = $input.prev('input')
                    }
                }
                executeFastEntry(fastEntry, data)
            }
        }).focus(function () {
            $(this).select()
        })

        $('#fastEntriesDiv span.clickable').click(function () {
            var entryKey = $(this).attr('entryKey')
            var fastEntry = fastEntriesConfig[entryKey]
            executeFastEntry(fastEntry, {})

        })
    }

    function executeFastEntry(fastEntry, data) {
        if (fastEntry.sql) {
            $.executeMultiSqlsAjax(parseTemplate(fastEntry.sql, fastEntry, data), true)
        }
        if (fastEntry.action) {
            executeFastAction(parseTemplate(fastEntry.action, fastEntry, data), fastEntry.separator || ',')
        }
        if (fastEntry.openLink) {
            window.open(parseTemplate(fastEntry.openLink, fastEntry, data), "_blank")
        }
        if (fastEntry.copy) {
            var copy = parseTemplate(fastEntry.copy, fastEntry, data)
            $.copyTextToClipboard(copy)
            $.copiedTips(copy)
        }
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