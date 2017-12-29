(function () {
    var regex = new RegExp(/[\0\x08\x09\x1a\n\r"'\\\%]/g)
    var escaper = function escaper(char) {
        var m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', "'", '"', "\\", '\\\\', "%"]
        var r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', "''", '""', '\\\\', '\\\\\\\\', '\\%']
        return r[m.indexOf(char)]
    }

    $.createInsert = function (cells, result) {
        var insertSql = 'insert into ' + wrapFieldName(result.TableName) + '('
        for (var i = 0; i < result.Headers.length; ++i) {
            if (i > 0) {
                insertSql += ', '
            }
            insertSql += wrapFieldName(result.Headers[i])
        }
        insertSql += ') values ('

        cells.each(function (jndex, cell) {
            if (jndex > 1) {
                insertSql += ', '
            }
            if (jndex > 0) {
                var newValue = $(cell).text()
                if ("(null)" == newValue) {
                    insertSql += 'null'
                } else {
                    insertSql += '\'' + newValue.replace(regex, escaper) + '\''
                }
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
                var newValue = $(cell).text()
                if ("(null)" == newValue) {
                    updateSql += wrapFieldName(fieldName) + ' is null'
                } else {
                    updateSql += wrapFieldName(fieldName) + ' = \'' + newValue.replace(regex, escaper) + '\''
                }
            }
        })
        return updateSql
    }

    function wrapFieldName(fieldName) {
        if (fieldName.indexOf('_') >= 0) return fieldName
        else return '`' + fieldName + '`'
    }

    $.createWherePart = function (updateSql, result, headRow, cells) {
        updateSql += ' where '
        if (result.PrimaryKeysIndex.length > 0) {
            for (var i = 0; i < result.PrimaryKeysIndex.length; ++i) {
                var ki = result.PrimaryKeysIndex[i] + 1
                if (i > 0) {
                    updateSql += ' and '
                }
                var pkName = $(headRow.get(ki + 1)).text()
                var $cell = $(cells.get(ki))
                var pkValue = $cell.attr('old') || $cell.text()
                updateSql += wrapFieldName(pkName) + ' = \'' + pkValue.replace(regex, escaper) + '\''
            }
            return updateSql
        } else {
            var wherePart = ''
            cells.each(function (jndex, cell) {
                if (jndex > 0) {
                    var whereValue = $(this).attr('old') || $(cell).text()
                    if (wherePart != '') {
                        wherePart += ' and '
                    }
                    var fieldName = $(headRow.get(jndex + 1)).text()

                    if ("(null)" == whereValue) {
                        wherePart += wrapFieldName(fieldName) + ' is null'
                    } else {
                        wherePart += wrapFieldName(fieldName) + ' = \'' + whereValue.replace(regex, escaper) + '\''
                    }
                }
            })
            if (wherePart != null) {
                updateSql += wherePart
            }
        }

        return updateSql
    }
})()