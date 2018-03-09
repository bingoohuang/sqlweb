(function () {
    // var regex = new RegExp(/[\0\x08\x09\x1a\n\r"'\\\%]/g)
    var regex = new RegExp(/[\0\x08\x09\x1a\n\r'\\\%]/g)
    var escaper = function (char) {
        var m = ['\\0', '\\x08', '\\x09', '\\x1a', '\\n', '\\r', "'", /*'"',*/ "\\", '\\\\', "%"]
        var r = ['\\\\0', '\\\\b', '\\\\t', '\\\\z', '\\\\n', '\\\\r', "''", /* '""',*/ '\\\\', '\\\\\\\\', '\\%']
        return r[m.indexOf(char)]
    }

    function createValuePart(cells) {
        var valueSql = '('
        cells.each(function (index, cell) {
            valueSql += index > 1 ? ', ' : ''
            if (index > 0) {
                var newValue = $(cell).text()
                valueSql += "(null)" == newValue ? 'null' : ('\'' + newValue.replace(regex, escaper) + '\'')
            }
        })
        return valueSql + ')'
    }

    $.createInsert = function (cells, result) {
        return $.createInsertSqlPrefix(result) + createValuePart(cells)

    }

    $.createInsertSqlPrefix = function (result) {
        var prefix = 'insert into ' + wrapFieldName(result.TableName) + '('
        for (var i = 0; i < result.Headers.length; ++i) {
            prefix += i > 0 ? ', ' : ''
            prefix += wrapFieldName(result.Headers[i])
        }
        return prefix + ') values'
    }

    $.createSelectSql = function (result) {
        var sql = 'select '

        for (var i = 0; i < result.Headers.length; ++i) {
            sql += i > 0 ? ', ' : ''
            sql += wrapFieldName(result.Headers[i])
        }

        return sql + ' from ' + result.TableName
    }

    $.createDeleteSqls = function (result, resultId) {
        var tbody = $('#queryResult' + resultId + ' tbody')
        var values = []
        tbody.find('tr.highlightRow:visible').each(function (index, tr) {
            var cells = $(tr).find('td.dataCell')
            var valuePart = createNormalWhere(result, cells)
            values.push(valuePart)
        })

        return values.join(';\n')
    }

    var createNormalWhere = function (result, cells) {
        var sql = 'delete * from ' + wrapFieldName(result.TableName) + ' where '
        if (result.PrimaryKeysIndex.length > 0) {
            for (var i = 0; i < result.PrimaryKeysIndex.length; ++i) {
                var ki = result.PrimaryKeysIndex[i]
                sql += i > 0 ? ' and ' : ''

                var pkName = result.Headers[ki]
                var $cell = cells.eq(ki + 1)
                var pkValue = $cell.text()
                sql += wrapFieldName(pkName) + ' = \'' + pkValue.replace(regex, escaper) + '\''
            }
            return sql
        } else {
            var wherePart = ''
            cells.each(function (index, cell) {
                if (index > 0) {
                    var whereValue = $(cell).text()
                    wherePart += wherePart != '' ? ' and ' : ''

                    var fieldName = result.Headers[index - 1]
                    wherePart += wrapFieldName(fieldName)
                    wherePart += "(null)" == whereValue ? ' is null' : ' = \'' + whereValue.replace(regex, escaper) + '\''
                }
            })

            sql += wherePart
        }

        return sql
    }

    $.createInsertValuesHighlighted = function (resultId) {
        var tbody = $('#queryResult' + resultId + ' tbody')
        var values = []
        tbody.find('tr.highlightRow:visible').each(function (index, tr) {
            var cells = $(tr).find('td.dataCell')
            var valuePart = createValuePart(cells)
            values.push(valuePart)
        })

        return values.join('\n')
    }

    $.createInsertValuesAll = function (resultId) {
        var tbody = $('#queryResult' + resultId + ' tbody')
        var values = []
        tbody.find('tr:visible').each(function (index, tr) {
            var cells = $(tr).find('td.dataCell')
            var valuePart = createValuePart(cells)
            values.push(valuePart)
        })

        return values.join('\n')
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