(function () {
    // var regex = new RegExp(/[\0\x08\x09\x1a\n\r"'\\\%]/g)
    var regex = new RegExp(/[\0\x08\x09\x1a\n\r'\\\%]/g)
    var escaper = function (char) {
        var m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', "'", /*'"',*/ "\\", '\\\\', "%"]
        var r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', "''",/* '""',*/ '\\\\', '\\\\\\\\', '\\%']
        return r[m.indexOf(char)]
    }

    $.createInsert = function (cells, result) {
        var insertSql = 'insert into ' + wrapFieldName(result.TableName) + '('
        for (var i = 0; i < result.Headers.length; ++i) {
            insertSql += i > 0 ? ', ' : ''
            insertSql += wrapFieldName(result.Headers[i])
        }
        insertSql += ') values ('

        cells.each(function (jndex, cell) {
            insertSql += jndex > 1 ? ', ' : ''
            if (jndex > 0) {
                var newValue = $(cell).text()
                insertSql += "(null)" == newValue ? 'null' : ('\'' + newValue.replace(regex, escaper) + '\'')
            }
        })
        return insertSql + ')'
    }

    $.createUpdateSetPart = function (cells, result, headRow) {
        var updateSql = null
        cells.each(function (jndex, cell) {
            var oldValue = $(this).attr('old')
            if (oldValue) {
                if (updateSql == null) {
                    updateSql = 'update ' + wrapFieldName(result.TableName) + ' set '
                } else {
                    updateSql += ', '
                }
                var fieldName = $(headRow.get(jndex + 1)).text()
                updateSql += wrapFieldName(fieldName)

                var newValue = $(cell).text()
                updateSql += "(null)" == newValue ? ' = null' : ' = \'' + newValue.replace(regex, escaper) + '\''
            }
        })
        return updateSql
    }

    function wrapFieldName(fieldName) {
        if (fieldName.indexOf('_') >= 0) return fieldName
        else return '`' + fieldName + '`'
    }

    $.createWherePart = function (result, headRow, cells) {
        var sql = ' where '
        if (result.PrimaryKeysIndex.length > 0) {
            for (var i = 0; i < result.PrimaryKeysIndex.length; ++i) {
                var ki = result.PrimaryKeysIndex[i] + 1
                sql += i > 0 ? ' and ' : ''

                var pkName = $(headRow.get(ki + 1)).text()
                var $cell = $(cells.get(ki))
                var pkValue = $cell.attr('old') || $cell.text()
                sql += wrapFieldName(pkName) + ' = \'' + pkValue.replace(regex, escaper) + '\''
            }
            return sql
        } else {
            var wherePart = ''
            cells.each(function (jndex, cell) {
                if (jndex > 0) {
                    var whereValue = $(this).attr('old') || $(cell).text()
                    wherePart += wherePart != '' ? ' and ' : ''

                    var fieldName = $(headRow.get(jndex + 1)).text()
                    wherePart += wrapFieldName(fieldName)
                    wherePart += "(null)" == whereValue ? ' is null' : ' = \'' + whereValue.replace(regex, escaper) + '\''
                }
            })

            sql += wherePart
        }

        return sql
    }
})()