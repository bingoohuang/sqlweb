(function () {
    function executeMultiSqls(sql, callback) {
        let sqls = []
        if (activeMerchantId.startsWith('daps-')) {
            sqls.push(sql);
        } else {
            sqls = $.splitSqls(sql, ';');
        }
        const executeResultContext = [];
        $.executeQueryAjaxOptions({
            classifier: activeClassifier,
            tid: activeMerchantId,
            tcode: activeMerchantCode,
            tname: activeMerchantCode,
            sql: sqls[0],
            resultId: null,
            sqls: sqls,
            nextIndex: 0,
            executeResultContext: executeResultContext,
            lastCallback: callback
        })
    }

    $.executeMultiSqlsAjaxOptions = function (options) {
        const sql = options.sql;
        const confirmUpdate = options.confirmUpdate;
        const callback = options.callback;

        const firstUpperWord = $.firstUpperWord(sql);
        if (confirmUpdate && firstUpperWord !== 'SELECT' && firstUpperWord !== 'EXPLAIN') {
            $.confirmMe('Are you sure to execute ?', sql, function () {
                executeMultiSqls(sql, callback)
            })
            return
        }

        executeMultiSqls(sql, callback)
    }

    $.executeMultiSqlsAjax = function (sql, confirmUpdate = false, callback) {
        return $.executeMultiSqlsAjaxOptions({
            sql: sql,
            confirmUpdate: confirmUpdate,
            callback: callback
        })
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
        const leftHolder = {};
        const fieldName = parseFieldName(sql, resultPos, keyLength, leftHolder).toUpperCase();
        const fieldNameIndex = findFieldName(result, fieldName);
        const joinedValues = createValues(fieldNameIndex, result);

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

    let originalTid = null;
    let lastTenant = null;

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
        const classifier = options.classifier;
        const tid = options.tid;
        const tcode = options.tcode;
        const tname = options.tname;
        let sql = options.sql;
        const resultId = options.resultId;
        const sqls = options.sqls;
        const nextIndex = options.nextIndex;
        const executeResultContext = options.executeResultContext;
        const forceTenant = options.forceTenant;
        const maxRows = options.maxRows;
        const forcePreserveResults = options.forcePreserveResults;
        const lastCallback = options.lastCallback;

        if (sqls && nextIndex > 0) {
            sql = translateSqlWithLastResults(sql, executeResultContext, nextIndex)
        }

        // /* tenant:18600010 */ select 1 from xxx
        sql = $.trim(sql)
        const tenantRe = /\/\*\s*tenant:\s*(.*?)\s*\*\/(.+)/;
        const tenantReResult = tenantRe.exec(sql);
        if (tenantReResult) {
            if (!originalTid) {
                originalTid = tid
            }

            const tenant = tenantReResult[1];
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
                    $.executeQueryAjaxOptions({
                        classifier: classifier,
                        tid: tid,
                        tcode: tcode,
                        tname: tname,
                        sql: sqls[nextIndex + 1],
                        resultId: resultId,
                        sqls: sqls,
                        nextIndex: nextIndex + 1,
                        executeResultContext: executeResultContext,
                        lastCallback: lastCallback,
                    })
                } else {
                    if (originalTid) {
                        defaultTenant = originalTid
                        $.searchTenants('%', lastCallback, false)
                    } else if (lastCallback != null) {
                        lastCallback()
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

                let hasError = 0;
                for (let i = 0; i < content.RowsResult.length; ++i) {
                    const rowResult = content.RowsResult[i];
                    if (rowResult.Message.indexOf("Error") >= 0 || !isDDl && !rowResult.Ok) {
                        $.alertMe(rowResult.Message)
                        ++hasError
                    } else {
                        $.copiedTips(sqls)
                        const rowIndex = sqlRowIndices[i];
                        const $row = $($rows[rowIndex]);

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
