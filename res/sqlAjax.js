(function () {
    function executeMultiSqls(sql) {
        var sqls = $.splitSqls(sql, ';')
        var executeResultContext = []
        $.executeQueryAjax(activeClassifier, activeMerchantId, activeMerchantCode, activeMerchantName, sqls[0], null, sqls, 0, executeResultContext)
    }

    $.executeMultiSqlsAjax = function (sql, confirmUpdate = false) {
        var firstUpperWord = $.firstUpperWord(sql);
        if (confirmUpdate && firstUpperWord != 'SELECT' && firstUpperWord != 'EXPLAIN') {
            $.confirmMe('Are you sure to execute ?', sql, function () {
                executeMultiSqls(sql)
            })
            return
        }

        executeMultiSqls(sql)
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

    var originalTid = null
    var lastTenant = null

    $.executeQueryAjax = function (classifier, tid, tcode, tname, sql, resultId, sqls, nextIndex, executeResultContext, forceTenant, maxRows) {
        return $.executeQueryAjaxOptions({
            classifier: classifier,
            tid: tid,
            tcode: tcode,
            tname: tname,
            sql: sql,
            resultId: resultId,
            sqls: sqls,
            nextIndex: nextIndex,
            executeResultContext: executeResultContext,
            forceTenant: forceTenant,
            maxRows: maxRows
        })
    }

    $.executeQueryAjaxOptions = function (options) {
        var classifier = options.classifier;
        var tid = options.tid;
        var tcode = options.tcode;
        var tname = options.tname;
        var sql = options.sql;
        var resultId = options.resultId;
        var sqls = options.sqls;
        var nextIndex = options.nextIndex;
        var executeResultContext = options.executeResultContext;
        var forceTenant = options.forceTenant;
        var maxRows = options.maxRows;
        var forcePreserveResults = options.forcePreserveResults;

        if (sqls && nextIndex > 0) {
            sql = translateSqlWithLastResults(sql, executeResultContext, nextIndex)
        }

        // /* tenant:18600010 */ select 1 from xxx
        sql = $.trim(sql)
        var tenantRe = /\/\*\s*tenant:\s*(.*?)\s*\*\/(.+)/
        var tenantReResult = tenantRe.exec(sql)
        if (tenantReResult) {
            if (!originalTid) {
                originalTid = tid
            }

            var tenant = tenantReResult[1]
            sql = tenantReResult[2]

            if (lastTenant !== tenant) {
                lastTenant = tenant

                $.searchTenants(tenant, function () {
                    $.executeQueryAjax(activeClassifier, activeMerchantId, activeMerchantCode, activeMerchantName,
                        sql, resultId, sqls, nextIndex, executeResultContext, true)
                }, true)
                return
            }
        } else if (!forceTenant && originalTid != null) {
            $.searchTenants(originalTid, function () {
                $.executeQueryAjax(classifier, tid, tcode, tname, sql, resultId, sqls, nextIndex, executeResultContext, true)
            }, true)
            return
        }

        $.ajax({
            type: 'POST',
            url: contextPath + "/query",
            data: {tid: tid, sql: sql, maxRows: maxRows || 0},
            success: function (content, textStatus, request) {
                if (content && content.Error) {
                    $.alertMe(content.Error)
                    return
                }

                $.copiedTips(sql)

                $.tableCreate(content, sql, resultId, classifier, tid, tcode, tname, forcePreserveResults)

                if (sqls) {
                    executeResultContext['_result_' + nextIndex] = content
                    executeResultContext['_result_last'] = content
                }

                if (sqls && (nextIndex + 1) < sqls.length) {
                    $.executeQueryAjax(classifier, tid, tcode, tname, sqls[nextIndex + 1], resultId, sqls, nextIndex + 1, executeResultContext)
                } else {
                    if (originalTid) {
                        defaultTenant = originalTid
                        $.searchTenants('%', null, false)
                    }
                    originalTid = null
                    lastTenant = null
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
        $('.tablesWrapper').hide()
    }

    $.executeUpdate = function (tid, sqlRowIndices, sqls, $rows, isDDl, okCallback) {
        $.ajax({
            type: 'POST',
            url: contextPath + "/update",
            data: {tid: tid, sqls: sqls},
            success: function (content, textStatus, request) {
                if (!content.Ok) {
                    $.alertMe(content.Message)
                    return
                }

                var hasError = 0
                for (var i = 0; i < content.RowsResult.length; ++i) {
                    var rowResult = content.RowsResult[i]
                    if (rowResult.Message.indexOf("Error") >= 0 || !isDDl && !rowResult.Ok) {
                        $.alertMe(rowResult.Message)
                        ++hasError
                    } else {
                        $.copiedTips(sqls)
                        var rowIndex = sqlRowIndices[i]
                        var $row = $($rows[rowIndex])

                        $row.find('td.dataCell').each(function (jndex, cell) {
                            $(this).removeAttr('old').removeClass('changedCell')
                        })
                        $row.remove('.deletedRow').removeClass('clonedRow').find('td').attr('contenteditable', false)
                    }
                }

                if (hasError === 0 && okCallback) okCallback()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }
})()
