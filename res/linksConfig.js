(function () {
    $.linksConfig = []

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
                callback: function (key) {
                    if (key === 'FindTablesByColumn') {
                        if (!tomlEditor.somethingSelected()) {
                            $.alertMe("Please choose the column name first")
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

            ReloadConfig()
        }
    })
    $('#CloseConfig').click(toogleLinksConfigDiv)

    $('#SaveConfig').click(function () {
        $.ajax({
            type: 'POST',
            url: contextPath + "/saveLinksConfig",
            data: {linksConfig: tomlEditor.getValue()},
            success: function (content) {
                if (content.OK === "OK") {
                    toogleLinksConfigDiv()

                    linksConfig = JSON.parse(content.Json)
                    createLinksConfig()
                } else {
                    $.alertMe(content.OK)
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })

    function FindTablesByColumn(columnName) {
        $.ajax({
            type: 'POST',
            url: contextPath + "/tablesByColumn",
            data: {tid: activeMerchantId, columnName: columnName},
            success: function (content) {
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
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    // refer : https://codemirror.net/mode/toml/index.html
    var tomlEditor = null

    function ReloadConfig() {
        $.ajax({
            type: 'POST',
            url: contextPath + "/loadLinksConfig",
            data: {},
            success: function (content) {
                if (tomlEditor != null) {
                    tomlEditor.setValue(content.LinksConfig)
                } else {
                    $('#tomlEditor').val(content.LinksConfig)
                }
                linksConfig = JSON.parse(content.Json)
                createLinksConfig()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    $.SingleTableQuery = {}

    function removePostfixTag(key) {
        var pos = key.indexOf("-")
        if (pos > 0) {
            return key.substr(0, pos)
        } else {
            return key
        }
    }

    var linksConfig = null

    function createLinksConfig() {
        if (linksConfig == null) {
            ReloadConfig()
            return
        }

        $.createFastEntries(linksConfig.entries)

        $.linksConfig = []

        $.each(linksConfig.links, function (key, entry) {
            if (entry.classifiers && entry.classifiers.indexOf(activeClassifier) < 0) return true
            if (entry.excludeClassifiers && entry.excludeClassifiers.indexOf(activeClassifier) >= 0) return true

            var field = entry.field || removePostfixTag(key)

            var relativeFieldGroup = []

            $.each(entry.linksTo, function (index, linkTo) {

                var dotIndex = linkTo.indexOf('.')

                var tableName = dotIndex < 0 ? linkTo : linkTo.substring(0, dotIndex)
                var filedName = dotIndex < 0 ? field : linkTo.substring(dotIndex + 1)

                relativeFieldGroup.push(tableName.toUpperCase())
                relativeFieldGroup.push(filedName.toUpperCase())
            })

            $.linksConfig.push(relativeFieldGroup)
        })


        $.SingleTableQuery = {}
        $.each(linksConfig.tables, function (tableName, value) {
            $.SingleTableQuery[tableName.toUpperCase()] = value
        })
    }

    $.refreshLinksConfig = createLinksConfig
})()