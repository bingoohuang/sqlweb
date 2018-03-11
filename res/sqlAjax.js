(function () {
    $.executeMultiSqlsAjax = function (sql, resultId) {
        var sqls = $.splitSqls(sql, ';')
        var executeResultContext = []
        $.executeQueryAjax(activeClassifier, activeMerchantId, activeMerchantName, sqls[0], null, sqls, 0, executeResultContext)
    }

    /*
    {
        "Headers": [ "USER_ID", "OPEN_ID", "MOBILE", "TYPE", "INVITER_ID" ],
        "Rows": [
        [ "1", "243894407111118848", "oWKxwxCSZouXYylrr2-SRj16Ibyg", "15168593302", "0", "(null)" ]
        ],
        "Error": "",
        "ExecutionTime": "2018-03-07 16:53:45.211",
        "CostTime": "8.141423ms",
        "DatabaseName": "dwtdcszfa2bfj1pkt",
        "TableName": "tt_f_user",
        "PrimaryKeysIndex": [ 0 ],
        "Msg": ""
    }
     */

    function parseFieldName(sql, resultLastPos, keyLength, leftHolder) {
        var rightPart = $.trim(sql.substring(resultLastPos + keyLength))
        var len = rightPart.length
        for (var i = 0; i < len; ++i) {
            var ch = rightPart[i]
            if (ch === ' ' || ch === '\t' || ch === '\n') {
                leftHolder.left = rightPart.substring(i)
                return rightPart.substring(0, i)
            }
        }
        leftHolder.left = ''
        return rightPart
    }

    function findFieldName(resultLast, fieldName) {
        for (var i = 0; i < resultLast.Headers.length; ++i) {
            if (resultLast.Headers[i].toUpperCase() === fieldName) {
                return i
            }
        }
        return -1;
    }

    function createValues(fieldNameIndex, resultLast) {
        var values = []
        if (fieldNameIndex >= 0 && resultLast.Rows && resultLast.Rows.length) {
            for (var i = 0; i < resultLast.Rows.length; ++i) {
                values.push(resultLast.Rows[i][fieldNameIndex + 1])
            }
        }
        return values.length > 0 ? "('" + values.join("','") + "')" : "('')"
    }

    function translateOne(result, sql, executeResultContext, lastIndex, resultPos, keyLength) {
        var leftHolder = {}
        var fieldName = parseFieldName(sql, resultPos, keyLength, leftHolder).toUpperCase()
        var fieldNameIndex = findFieldName(result, fieldName)
        var joinedValues = createValues(fieldNameIndex, result)

        return sql.substring(0, resultPos) + joinedValues
            + translateSqlWithLastResults(leftHolder.left, executeResultContext, lastIndex)
    }

    function translateSqlWithLastResults(sql, executeResultContext, lastIndex) {
        var resultPos = sql.indexOf('_result_')
        if (resultPos > 0) {
            if (sql.indexOf('_result_last.') === resultPos) {
                var result = executeResultContext['_result_last']
                return translateOne(result, sql, executeResultContext, lastIndex, resultPos, '_result_last.'.length)
            } else {
                for (var i = lastIndex - 1; i >= 0; --i) {
                    var key = '_result_' + i + '.'
                    if (sql.indexOf(key) === resultPos) {
                        var result = executeResultContext['_result_' + i]
                        return translateOne(result, sql, executeResultContext, lastIndex, resultPos, key.length)
                    }
                }
            }
        }

        return sql
    }

    $.executeQueryAjax = function (classifier, tid, tname, sql, resultId, sqls, nextIndex, executeResultContext) {
        if (sqls && nextIndex > 0) {
            sql = translateSqlWithLastResults(sql, executeResultContext, nextIndex)
        }

        $.ajax({
            type: 'POST',
            url: contextPath + "/query",
            data: {tid: tid, sql: sql},
            success: function (content, textStatus, request) {
                $.tableCreate(content, sql, resultId, classifier, tid, tname)

                if (sqls) {
                    executeResultContext['_result_' + nextIndex] = content
                    executeResultContext['_result_last'] = content
                }

                if (sqls && (nextIndex + 1) < sqls.length) {
                    $.executeQueryAjax(classifier, tid, tname, sqls[nextIndex + 1], resultId, sqls, nextIndex + 1, executeResultContext)
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
        $('.tablesWrapper').hide()
    }

    $.executeUpdate = function (sqlRowIndices, sqls, $rows) {
        $.ajax({
            type: 'POST',
            url: contextPath + "/update",
            data: {tid: activeMerchantId, sqls: sqls},
            success: function (content, textStatus, request) {
                if (!content.Ok) {
                    alert(content.Message)
                    return
                }

                for (var i = 0; i < content.RowsResult.length; ++i) {
                    var rowResult = content.RowsResult[i]
                    if (!rowResult.Ok) {
                        alert(rowResult.Message)
                    } else {
                        var rowIndex = sqlRowIndices[i]
                        var $row = $($rows[rowIndex])

                        $row.find('td.dataCell').each(function (jndex, cell) {
                            $(this).removeAttr('old').removeClass('changedCell')
                        })
                        $row.find('input[type=checkbox]').prop('checked', false)
                        $row.remove('.deletedRow').removeClass('clonedRow')
                    }
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }
})()