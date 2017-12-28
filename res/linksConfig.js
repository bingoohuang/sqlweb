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
        tomlEditor.setValue(linksConfig)
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

                    linksConfig = tomlEditor.getValue()
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
        tomlEditor.setValue(linksConfig)
    })

    var tomlEditor = null
    var linksConfig = ''

    function ReloadConfig() {
        $.ajax({
            type: 'POST',
            url: pathname + "/loadLinksConfig",
            success: function (content, textStatus, request) {
                linksConfig = content
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    ReloadConfig()

})()