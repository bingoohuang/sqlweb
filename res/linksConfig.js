(function () {
    function toogleLinksConfigDiv() {
        $('#linksConfigDiv').toggle()
        $('#sqlwebDiv').toggle()
    }

    $('#linkConfigBtn').click(function () {
        toogleLinksConfigDiv()

        if (tomlEditor == null) {
            tomlEditor = CodeMirror.fromTextArea(document.getElementById("tomlEditor"), {
                mode: 'text/x-toml', lineNumbers: true
            })

            $.contextMenu({
                selector: '#linksConfigDiv .CodeMirror',
                zIndex: 10,
                callback: function (key, options) {
                    if (key === 'FindTablesByColumn') {
                        if (!tomlEditor.somethingSelected()) {
                            alert("Please choose the column name first")
                            return
                        }

                        var columnName = tomlEditor.getSelection()
                        FindTablesByColumn(columnName)
                    } else if (key === 'ReloadConfig') {
                        ReloadConfig()
                    }
                },
                items: {
                    FindTablesByColumn: {name: 'Find Tables', icon: 'tables'},
                    ReloadConfig: {name: 'Reset Config', icon: 'reload'},
                }
            })
        }
    })
    $('#CloseConfig').click(toogleLinksConfigDiv)

    $('#SaveConfig').click(function () {
        $.ajax({
            type: 'POST',
            url: contextPath + "/saveLinksConfig",
            data: {linksConfig: tomlEditor.getValue(), activeClassifier: activeClassifier},
            success: function (content, textStatus, request) {
                if (content.OK === "OK") {
                    toogleLinksConfigDiv()

                    createLinksConfig(JSON.parse(content.Json))
                } else {
                    alert(content.OK)
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })

    function FindTablesByColumn(columnName) {
        $.ajax({
            type: 'POST',
            url: contextPath + "/tablesByColumn",
            data: {tid: activeMerchantId, columnName: columnName},
            success: function (content, textStatus, request) {
                var tablesHtml = ''
                if (content.Rows.length == 0) {
                    tablesHtml += '<div>There are no tables which has column ' + columnName + '</div>'
                } else {
                    tablesHtml += '<div>There are ' + content.Rows.length + ' tables which has column ' + columnName + ':</div>'
                    $.each(content.Rows, function (index, row) {
                        tablesHtml += '<span>' + row[1] + '</span>'
                    })
                }
                $('#tablesWithSpecifiedColumn').html(tablesHtml)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    // refer : https://codemirror.net/mode/toml/index.html
    var tomlEditor = null

    var lastActiveClassifier  = null

    function ReloadConfig() {
        if (lastActiveClassifier === activeClassifier) {
            return
        }

        lastActiveClassifier = activeClassifier

        $.ajax({
            type: 'POST',
            url: contextPath + "/loadLinksConfig",
            data: {activeClassifier: lastActiveClassifier},
            success: function (content, textStatus, request) {
                if (tomlEditor != null) {
                    tomlEditor.setValue(content.LinksConfig)
                } else {
                    $('#tomlEditor').val(content.LinksConfig)
                }
                createLinksConfig(JSON.parse(content.Json))
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    $.ReloadConfig = ReloadConfig

    function createLinksConfig(linksConfig) {
        $.createFastEntries(linksConfig.entries)

        $.linksConfig = []
        $.each(linksConfig.links, function (key, value) {
            var relativeFieldGroup = []

            $.each(value.linksTo, function (index, linkTo) {
                var dotIndex = linkTo.indexOf('.')

                var tableName = dotIndex < 0 ? linkTo : linkTo.substring(0, dotIndex)
                var filedName = dotIndex < 0 ? key : linkTo.substring(dotIndex + 1)

                relativeFieldGroup.push(tableName.toUpperCase())
                relativeFieldGroup.push(filedName.toUpperCase())
            })

            $.linksConfig.push(relativeFieldGroup)
        })
    }
})()