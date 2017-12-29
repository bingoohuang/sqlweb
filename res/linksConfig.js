(function () {
    function toogleLinksConfigDiv() {
        $('#linksConfigDiv').toggle()
        $('#sqlwebDiv').toggle()
    }

    $('#linkConfigBtn').click(function () {
        toogleLinksConfigDiv()

        tomlEditor.setSize(null, '500px')
    })
    $('#CloseConfig').click(toogleLinksConfigDiv)
    $('#ReloadConfig').click(ReloadConfig)

    $('#SaveConfig').click(function () {
        $.ajax({
            type: 'POST',
            url: pathname + "/saveLinksConfig",
            data: {linksConfig: tomlEditor.getValue()},
            success: function (content, textStatus, request) {
                if (content.OK === "OK") {
                    toogleLinksConfigDiv()

                    createLinksConfig(JSON.parse(content.Json))
                } else {
                    alert(content)
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })


    // refer : https://codemirror.net/mode/toml/index.html
    var tomlEditor = CodeMirror.fromTextArea(document.getElementById("tomlEditor"), {
        mode: 'text/x-toml', lineNumbers: true
    })

    function ReloadConfig() {
        $.ajax({
            type: 'POST',
            url: pathname + "/loadLinksConfig",
            success: function (content, textStatus, request) {
                tomlEditor.setValue(content.LinksConfig)
                createLinksConfig(JSON.parse(content.Json))
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    ReloadConfig()

    function createLinksConfig(linksConfig) {
        $.createFastEntries(linksConfig.entries)

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
            member_id: {
                tt_f_user: "user_id",
                tt_f_member: "member_id",
                tt_f_mbr_card: "user_id"
            }
        }
        */

        $.each(linksConfig.links, function (key, value) {
            var fieldTable = {}
            var upperLinkedField = key.toUpperCase()
            $linksConfig.fields[upperLinkedField] = fieldTable

            $.each(value.linksTo, function (index, linkTo) {
                var dotIndex = linkTo.indexOf('.')

                var tableName = dotIndex < 0 ? linkTo : linkTo.substring(0, dotIndex)
                var filedName = dotIndex < 0 ? key : linkTo.substring(dotIndex + 1)
                var upperTable = tableName.toUpperCase()
                var upperField = filedName.toUpperCase()

                $linksConfig.tables[upperTable] = $linksConfig.tables[upperTable] || {}
                $linksConfig.tables[upperTable][upperField] = upperLinkedField

                if (upperLinkedField !== upperField) {
                    $linksConfig.fields[upperField] = fieldTable
                }

                fieldTable[upperTable] = upperField
            })
        })

        $.linksConfig = $linksConfig
    }
})()