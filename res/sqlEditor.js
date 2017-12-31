(function () {
    var MIN_HEIGHT = 60
    var start_y
    var start_h

    function on_drag(e) {
        var newHeight = Math.max(MIN_HEIGHT, (start_h + e.y - start_y)) + "px"
        codeMirror.setSize(null, newHeight)
    }

    function on_release(e) {
        document.body.removeEventListener("mousemove", on_drag)
        window.removeEventListener("mouseup", on_release)
    }

    $('.resizeHandle')[0].addEventListener("mousedown", function (e) {
        start_y = e.y
        start_h = $('.CodeMirror').height()
        document.body.addEventListener("mousemove", on_drag)
        window.addEventListener("mouseup", on_release)
    })

    var mac = CodeMirror.keyMap.default == CodeMirror.keyMap.macDefault // 判断是否为Mac
    var runKey = (mac ? "Cmd" : "Ctrl") + "-Enter"
    var extraKeys = {}
    extraKeys[runKey] = function (cm) {
        var executeQuery = $('.executeQuery')
        if (!executeQuery.prop("disabled")) executeQuery.click()
    }

    var codeMirror = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: 'text/x-mysql',
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets: true,
        extraKeys: extraKeys
    })

    $.contextMenu({
        selector: '#sqlwebDiv .CodeMirror',
        callback: function (key, options) {
            if (key === 'FormatSql') {
                var sql = codeMirror.somethingSelected() ? codeMirror.getSelection() : codeMirror.getValue()
                var formattedSql = sqlFormatter.format(sql, {language: 'sql'})
                codeMirror.setValue(formattedSql)
            } else if (key === 'ClearSql') {
                codeMirror.setValue('')
            } else if (key === 'RunSql') {
                if ($('.executeQuery').prop('disabled') === false) {
                    $('.executeQuery').click()
                }
            }
        },
        items: {
            RunSql: {name: 'Run SQL', icon: 'run'},
            FormatSql: {name: 'Format SQL', icon: 'format'},
            ClearSql: {name: 'Clear SQL', icon: 'clear'}
        }
    })

    $('.executeQuery').prop("disabled", true).click(function () {
        var sql = codeMirror.somethingSelected() ? codeMirror.getSelection() : codeMirror.getValue()
        $.executeQueryAjax(sql)
    })

})()