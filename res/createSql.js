(function () {
    const regex = new RegExp(/[\n\r']/g);

    $.escapeSqlValue = function (value) {
        return value.replace(regex, function (char) {
            const m = ['\n', '\r', "'"];
            const r = ['\\n', '\\r', "''"];
            return r[m.indexOf(char)]
        })
    };

    function createValuePart(cells) {
        let valueSql = '(';
        cells.each(function (index, cell) {
            valueSql += index > 1 ? ', ' : '';
            if (index > 0) {
                var newValue = $.cellNewValue($(cell))
                valueSql += "(null)" === newValue ? 'null' : ('\'' + $.escapeSqlValue(newValue) + '\'')
            }
        });
        return valueSql + ')'
    }

    $.createInsert = function (cells, result) {
        return $.createInsertSqlPrefix(result) + createValuePart(cells)
    }

    function createFieldNamesList(result) {
        var headers = result.Headers
        var fieldNames = ''
        for (var i = 0; i < headers.length; ++i) {
            fieldNames += i > 0 ? ', ' : ''
            fieldNames += wrapFieldName(headers[i])
        }

        return fieldNames
    }

    function createJavaBeanFieldNamesList(result) {
        var headers = result.Headers
        var fieldNames = ''
        for (var i = 0; i < headers.length; ++i) {
            var header = headers[i]
            if (header.toLowerCase().indexOf("time") >= 0) {
                fieldNames += '    private DateTime '
            } else {
                fieldNames += '    private String '
            }

            fieldNames += camelCased(header) + ';\n'
        }

        return fieldNames
    }

    $.createInsertSqlPrefix = function (result) {
        return 'insert into ' + wrapFieldName(result.TableName || 'xxx') + '(' + createFieldNamesList(result) + ') values'
    }

    $.createSelectEqlTemplate = function (result) {
        return 'select ' + createFieldNamesList(result) + '\nfrom ' + wrapFieldName(result.TableName || 'xxx') + '\nwhere ' + createWhereItems(result)
    }
    $.createUpdateEqlTemplate = function (result) {
        return 'update ' + wrapFieldName(result.TableName || 'xxx') + '\nset ' + createSetItems(result) + '\nwhere ' + createWhereItems(result)
    }
    $.createDeleteEqlTemplate = function (result) {
        return 'delete from ' + wrapFieldName(result.TableName || 'xxx') + '\nwhere ' + createWhereItems(result)
    }

    $.createJavaBean = function (result) {
        var bean = 'import lombok.*;\n' +
            '\n' +
            '@Data @AllArgsConstructor @NoArgsConstructor @Builder\n' +
            'public class ' + CamelCased(result.TableName || 'xxx') + ' {\n'
        bean += createJavaBeanFieldNamesList(result)
        bean += '}'

        return bean
    }

    function createSetItems(result) {
        var headers = result.Headers

        var sql = ''
        for (var i = 0; i < headers.length; ++i) {
            sql += sql != '' ? ',\n' : ''
            var fieldName = headers[i]
            sql += wrapFieldName(fieldName) + ' = \'#' + camelCased(fieldName) + '#\''
        }

        return sql
    }

    function createWhereItems(result) {
        var pkIndexes = result.PrimaryKeysIndex;
        var headers = result.Headers

        var sql = ''
        if (pkIndexes.length > 0) {
            for (var i = 0; i < pkIndexes.length; ++i) {
                var ki = pkIndexes[i]
                sql += i > 0 ? '\nand ' : ''

                var pkName = headers[ki]
                sql += wrapFieldName(pkName) + ' = \'#' + camelCased(pkName) + '#\''
            }
            return sql
        } else {
            var wherePart = ''
            for (var i = 0; i < headers.length; ++i) {
                wherePart += wherePart != '' ? '\nand ' : ''
                var fieldName = headers[i]
                wherePart += wrapFieldName(fieldName) + ' = \'#' + camelCased(fieldName) + '#\''
            }
            sql += wherePart
        }

        return sql
    }

    function createWhereClause(result, cells) {
        var headers = result.Headers
        var where = ''
        if (result.PrimaryKeysIndex.length > 0) {
            for (var i = 0; i < result.PrimaryKeysIndex.length; ++i) {
                var ki = result.PrimaryKeysIndex[i]
                where += i > 0 ? ' and ' : ''

                var pkName = headers[ki]
                var pkValue = $.cellOldValue(cells.eq(ki + 1))
                where += $.wrapWhereCondition(pkName, pkValue)
            }
        } else {
            var wherePart = ''
            cells.each(function (index, cell) {
                if (index > 0) {
                    wherePart += wherePart != '' ? ' and ' : ''
                    var fieldName = headers[index - 1]

                    var whereValue = $.cellOldValue($(cell))
                    wherePart += $.wrapWhereCondition(fieldName, whereValue)
                }
            })
            where += wherePart
        }
        return where;
    }

    function camelCased(str) {
        return str.toLowerCase().replace(/_([a-z])/g, function (g) {
            return g[1].toUpperCase()
        })
    }

    function CamelCased(str) {
        var camelCasedStr = str.toLowerCase().replace(/_([a-z])/g, function (g) {
            return g[1].toUpperCase()
        })

        return camelCasedStr.substr(0, 1).toUpperCase() + camelCasedStr.substring(1)
    }

    $.createInsertEqlTemplate = function (result) {
        var values = 'insert into ' + wrapFieldName(result.TableName || 'xxx') + '(' + createFieldNamesList(result) + ')\nvalues('
        var headers = result.Headers
        for (var i = 0; i < headers.length; ++i) {
            values += i > 0 ? ', ' : ''
            values += '\'#' + camelCased(headers[i]) + '#\''
        }
        return values + ')'
    }

    $.createSelectSql = function (result) {
        var sql = 'select '

        var headers = result.Headers
        for (var i = 0; i < headers.length; ++i) {
            sql += i > 0 ? ', ' : ''
            sql += wrapFieldName(headers[i])
        }

        return sql + ' from ' + wrapFieldName(result.TableName || 'xxx')
    }

    $.createSelectSqls = function (selectSql, result, resultId) {
        var tbody = $('#queryResult' + resultId + ' tbody')
        var values = []
        tbody.find('tr.highlight:visible').each(function (index, tr) {
            var cells = $(tr).find('td.dataCell')
            var valuePart = createSelectForRow(selectSql, result, cells)
            values.push(valuePart)
        })

        return values.join(';\n')
    }


    var createSelectForRow = function (selectSql, result, cells) {
        var sql = selectSql + ' where '
        var where = createWhereClause(result, cells)
        return sql + where
    }

    $.createDeleteSqls = function (result, resultId) {
        var tbody = $('#queryResult' + resultId + ' tbody')
        var values = []
        tbody.find('tr.highlight:visible').each(function (index, tr) {
            var cells = $(tr).find('td.dataCell')
            var valuePart = createDeleteForRow(result, cells)
            values.push(valuePart)
        })

        return values.join(';\n')
    }


    var createDeleteForRow = function (result, cells) {
        var sql = 'delete from ' + wrapFieldName(result.TableName || 'xxx') + ' where '
        var where = createWhereClause(result, cells)
        return sql + where
    }


    $.createInsertValuesHighlighted = function (resultId) {
        var tbody = $('#queryResult' + resultId + ' tbody')
        var values = []
        tbody.find('tr.highlight:visible').each(function (index, tr) {
            var cells = $(tr).find('td.dataCell')
            var valuePart = createValuePart(cells)
            values.push(valuePart)
        })

        return values.join(',\n')
    }

    $.createInsertValuesAll = function (resultId) {
        var tbody = $('#queryResult' + resultId + ' tbody')
        var values = []
        tbody.find('tr:visible').each(function (index, tr) {
            var cells = $(tr).find('td.dataCell')
            var valuePart = createValuePart(cells)
            values.push(valuePart)
        })

        return values.join(',\n')
    }

    $.createUpdateSetPart = function (cells, result, headRow) {
        var updateSql = null
        cells.each(function (jndex, cell) {
            var changedCell = $(this).hasClass('changedCell')
            if (changedCell) {
                if (updateSql == null) {
                    updateSql = 'update ' + wrapFieldName(result.TableName || 'xxx') + ' set '
                } else {
                    updateSql += ', '
                }
                var fieldName = $(headRow.get(jndex + 1)).text()
                var newValue = $.cellNewValue($(cell))
                updateSql += $.wrapWhereCondition(fieldName, newValue)
            }
        })
        return updateSql
    }

    $.cellNewValue = function ($cell) {
        return $.trim($cell.hasClass('textAreaTd') ? $cell.find('textarea').val() : $cell.text())
    }

    function wrapFieldName(fieldName) {
        if (fieldName.indexOf('_') >= 0) return fieldName
        else return '`' + fieldName + '`'
    }

    $.wrapFieldName = wrapFieldName

    var cellOldValue = function ($cell) {
        var old = $cell.attr('old');
        return old === undefined ? $cell.text() : old
    }

    $.cellOldValue = cellOldValue

    $.createWherePart = function (result, headRow, cells) {
        var sql = ' where '
        if (result.PrimaryKeysIndex.length > 0) {
            for (var i = 0; i < result.PrimaryKeysIndex.length; ++i) {
                var ki = result.PrimaryKeysIndex[i] + 1
                sql += i > 0 ? ' and ' : ''

                var pkName = $(headRow.get(ki + 1)).text()
                var $cell = $(cells.get(ki))
                sql += $.wrapWhereCondition(pkName, $.cellOldValue($cell))
            }
            return sql
        } else {
            var wherePart = ''
            cells.each(function (jndex, cell) {
                if (jndex > 0) {
                    wherePart += wherePart !== '' ? ' and ' : ''

                    var fieldName = $(headRow.get(jndex + 1)).text()
                    wherePart += $.wrapWhereCondition(fieldName, $.cellOldValue($(this)))
                }
            })

            sql += wherePart
        }

        return sql
    }
})()