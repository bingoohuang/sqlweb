(function () {
    var columnInfoCache = {}

    $.processShowColumn = function (classifier, tid, tableName, columnName) {
        if (tryShowColumnInfo(classifier, tableName, columnName)) return

        $.ajax({
            type: 'POST',
            url: contextPath + "/query",
            data: {tid: tid, sql: 'show full columns from ' + tableName},
            success: function (content, textStatus, request) {
                if (content && content.Error) {
                    return alert(content.Error)
                }
                showColumnInfo(classifier, content, tableName, columnName)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    function createRowsColumnInfo(rows, classifier, tableName) {
        for (var i = 0; i < rows.length; ++i) {
            createColumnInfo(rows[i], classifier, tableName)
        }
    }

    function delayShowColumnInfo(columnInfo) {
        var $columnInfo = $(columnInfo)
        $columnInfo.prependTo($('#rightBottomFloatingDiv'))
        setTimeout(function () {
            $columnInfo.remove()
        }, 60 * 1000)
    }

    function createColumnInfo(row, classifier, tableName) {
        var columnInfo = '<div>' + row[1] + '&nbsp;' + row[2] + '&nbsp;'
            + (row[4] === 'NO' ? 'NOT NULL&nbsp;' : 'NULL&nbsp;')
            + (row[5] ? row[5] + '&nbsp;' : '') // Key
            + (row[6] && row[6] !== '(null)' ? ('default \'' + row[6] + '\'&nbsp;') : '') // default
            + (row[9] ? 'COMMENT \'' + row[9] + '\'' : '') + '</div>'

        var key = classifier + '.' + tableName + '.' + row[1]
        columnInfoCache[key.toUpperCase()] = columnInfo
    }

    function showColumnInfo(classifier, content, tableName, columnName) {
        if (!content || !content.Rows || !content.Rows.length) return

        createRowsColumnInfo(content.Rows, classifier, tableName)
        tryShowColumnInfo(classifier, tableName, columnName)
    }

    function tryShowColumnInfo(classifier, tableName, columnName) {
        var key = classifier + '.' + tableName + '.' + columnName
        var columnInfo = columnInfoCache[key.toUpperCase()]
        if (columnInfo) {
            delayShowColumnInfo(columnInfo)
        }

        return !!columnInfo
    }
})()