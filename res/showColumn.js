(function () {
    var columnInfoCache = {}

    $.downloadColumn = function (classifier, tid, tableName, columnName, resultId, result, $cell) {
        let sql = "select " + columnName + ' from  ' + tableName
            + createWherePart4Download(resultId, result, $cell.parent('tr').find('td.dataCell'), columnName)
            + ' limit 1'

        // alert(sql)

        let fileName = window.prompt("please input download file name", "xxx");

        $.ajax({
            type: 'POST', url: contextPath + "/downloadColumn",
            data: {tid: tid, sql: sql, fileName: fileName},
            dataType: 'native',
            xhrFields: {
                responseType: 'blob'
            },
            success: function (blob) {
                let link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    var createWherePart4Download = function (resultId, result, cells, columnName) {
        var table = $('#queryResult' + resultId)
        var headRow = table.find('tr.headRow').first().find('td')

        var sql = ' where '
        if (result.PrimaryKeysIndex.length > 0) {
            for (var i = 0; i < result.PrimaryKeysIndex.length; ++i) {
                var ki = result.PrimaryKeysIndex[i] + 1
                sql += i > 0 ? ' and ' : ''

                var pkName = $(headRow.get(ki + 1)).text()
                var $cell = $(cells.get(ki))
                var pkValue = $.cellValue($cell)
                sql += $.wrapFieldName(pkName) + ' = \'' + $.escapeSqlValue(pkValue) + '\''
            }
            return sql
        } else {
            var wherePart = ''
            cells.each(function (jndex, cell) {
                if (jndex > 0) {
                    var whereValue = $.cellValue($(cell))
                    wherePart += wherePart !== '' ? ' and ' : ''

                    var fieldName = $(headRow.get(jndex + 1)).text()
                    if (fieldName !== columnName) {
                        wherePart += $.wrapFieldName(fieldName)
                        wherePart += "(null)" === whereValue ? ' is null' : ' = \'' + $.escapeSqlValue(whereValue) + '\''
                    }
                }
            })

            sql += wherePart
        }

        return sql
    }

    $.processShowColumn = function (classifier, tid, tableName, columnName) {
        if (tryShowColumnInfo(classifier, tableName, columnName)) return

        $.ajax({
            type: 'POST',
            url: contextPath + "/query",
            data: {tid: tid, sql: 'show full columns from ' + tableName},
            success: function (content, textStatus, request) {
                if (content && content.Error) {
                    $.alertMe(content.Error)
                    return
                }
                showColumnInfo(classifier, content, tableName, columnName)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
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