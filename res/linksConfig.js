(function () {
    $('#linkConfigBtn').click(function () {
        $('#sqlwebDiv').hide()
        $('#linksConfigDiv').show()

        if (tomlEditor == null) {
            // refer : https://codemirror.net/mode/toml/index.html
            tomlEditor = CodeMirror.fromTextArea(document.getElementById("tomlEditor"), {
                mode: 'text/x-toml',
                lineNumbers: true
            })

            tomlEditor.setSize(null, '300px')
        }
        tomlEditor.setValue(linksConfigStr)
    })

    $('#SaveConfig').click(function () {
        $.ajax({
            type: 'POST',
            url: pathname + "/saveLinksConfig",
            data: {linksConfig: tomlEditor.getValue()},
            success: function (content, textStatus, request) {
                if (content === "OK") {
                    $('#linksConfigDiv').hide()
                    $('#sqlwebDiv').show()

                    linksConfigStr = tomlEditor.getValue()
                    var linksConfigToml = toml(linksConfigStr)
                    createLinksConfig(linksConfigToml)
                } else {
                    alert(content)
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })

    $('#CloseConfig').click(function () {
        $('#linksConfigDiv').hide()
        $('#sqlwebDiv').show()
    })

    $('#ReloadConfig').click(function () {
        ReloadConfig()
        tomlEditor.setValue(linksConfigStr)
    })

    var tomlEditor = null
    var linksConfigStr = ''


    function ReloadConfig() {
        $.ajax({
            type: 'POST',
            url: pathname + "/loadLinksConfig",
            success: function (content, textStatus, request) {
                linksConfigStr = content
                var linksConfigToml = toml(linksConfigStr)
                createLinksConfig(linksConfigToml)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    function createLinksConfig(linksConfig) {
        var $linksConfig = {tables: {}, fields: {}}
        /*
        tables: {
            tt_f_user: {"user_id": "user_id"},
            tt_f_member: {"member_id": "user_id"},
            tt_f_mbr_card: {"user_id": "user_id"}
        },
        fields: {
            user_id: {
                tt_f_user: "user_id",
                tt_f_member: "member_id",
                tt_f_mbr_card: "user_id"
            }
        }
        */

        $.each(linksConfig.links, function (key, value) {
            var fieldTable = {}

            $.each(value.linksTo, function (index, linkTo) {
                var dotIndex = linkTo.indexOf('.')
                var tableName = dotIndex < 0 ? linkTo : linkTo.substring(0, dotIndex)
                var filedName = dotIndex < 0 ? key : linkTo.substring(dotIndex + 1)

                $linksConfig.tables[tableName] = $linksConfig.tables[tableName] || {}
                $linksConfig.tables[tableName][filedName] = key

                fieldTable[tableName] = filedName
            })

            $linksConfig.fields[key] = fieldTable
            $.linksConfig = $linksConfig
        })
    }

    ReloadConfig()

})()