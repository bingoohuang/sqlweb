(function () {
    function tryAddSql(sqls, sql) {
        var trimSql = sql.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
        if (trimSql !== '') {
            sqls.push(trimSql)
        }
    }


    $.splitSqls = function (sqlsString, separateChar) {
        var sqls = []

        var inQuoted = false
        var pos = 0
        var len = sqlsString.length
        for (var i = 0; i < len; ++i) {
            var ch = sqlsString[i]
            if (ch === '\\') {
                ++i
            } else if (ch == '\'') {
                if (inQuoted && i + 1 < len && sqlsString[i + 1] === '\'') {
                    ++i  // jump escape for literal apostrophe, or single quote
                } else {
                    inQuoted = !inQuoted
                }
            } else if (!inQuoted && ch === separateChar) {
                tryAddSql(sqls, sqlsString.substring(pos, i))
                pos = i + 1
            }
        }

        if (pos < len) {
            tryAddSql(sqls, sqlsString.substring(pos))
        }
        return sqls
    }

    $.copyTextToClipboard = function (text) {
        var textArea = document.createElement("textarea")

        textArea.style.position = 'fixed'
        textArea.style.top = 0
        textArea.style.left = 0
        textArea.style.width = '2em'
        textArea.style.height = '2em'
        textArea.style.padding = 0
        textArea.style.border = 'none'
        textArea.style.outline = 'none'
        textArea.style.boxShadow = 'none'
        textArea.style.background = 'transparent'
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        try {
            var successful = document.execCommand('copy')
            var msg = successful ? 'successful' : 'unsuccessful'
            console.log('Copying text command was ' + msg)
        } catch (err) {
            console.log('Oops, unable to copy')
        }
        document.body.removeChild(textArea)
    }
})()