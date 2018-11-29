(function () {
    var ExcludedIntelliSenseTriggerKeys = {
        "8": "backspace",
        "9": "tab",
        "13": "enter",
        "16": "shift",
        "17": "ctrl",
        "18": "alt",
        "19": "pause",
        "20": "capslock",
        "27": "escape",
        "33": "pageup",
        "34": "pagedown",
        "35": "end",
        "36": "home",
        "37": "left",
        "38": "up",
        "39": "right",
        "40": "down",
        "45": "insert",
        "46": "delete",
        "91": "left window key",
        "92": "right window key",
        "93": "select",
        "107": "add",
        "109": "subtract",
        "110": "decimal point",
        "111": "divide",
        "112": "f1",
        "113": "f2",
        "114": "f3",
        "115": "f4",
        "116": "f5",
        "117": "f6",
        "118": "f7",
        "119": "f8",
        "120": "f9",
        "121": "f10",
        "122": "f11",
        "123": "f12",
        "144": "numlock",
        "145": "scrolllock",
        "186": "semicolon",
        "187": "equalsign",
        "188": "comma",
        "189": "dash",
        "190": "period",
        "191": "slash",
        "192": "graveaccent",
        "220": "backslash",
        "222": "quote"
    }

    $.ExcludedIntelliSenseTriggerKeys = ExcludedIntelliSenseTriggerKeys

    function isCharForShowHint(str) {
        return str.length === 1 && str.match(/[a-z\._0-9]/i)
    }
    $.isCharForShowHint = isCharForShowHint
    function showTables(result, tableColumns) {
        var resultHtml = ''
        if (result.Rows && result.Rows.length > 0) {
            for (var i = 0; i < result.Rows.length; i++) {
                var tableName = result.Rows[i][1];
                resultHtml += '<span>' + tableName + '</span>'
            }
        }
        $('.tables').html(resultHtml)
        $('.searchTableNames').change()

        var timeout = null
        var editor = $.sqlCodeMirror
        editor.off("keyup")
        editor.on("keyup", function (cm, event) {
            if (ExcludedIntelliSenseTriggerKeys[(event.keyCode || event.which).toString()]
                || cm.state.completionActive) return

            var cur = cm.getCursor()
            var ch = cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur)
            if (!isCharForShowHint(ch)) return

            var tok = cm.getTokenAt(cur)
            if (tok.type == "string" && tok.string.length >= 1 && tok.string.substr(0, 1) === "'") return false;

            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(function () {
                CodeMirror.showHint(cm, CodeMirror.hint.sql, {
                    // "completeSingle: false" prevents case when you are typing some word
                    // and in the middle it is automatically completed and you continue typing by reflex.
                    // So user will always need to select the intended string
                    // from popup (even if it's single option). (copy from @Oleksandr Pshenychnyy)
                    completeSingle: false,
                    tables: tableColumns
                })
            }, 150)
        })


        $.contextMenu({
            zIndex: 10,
            selector: '.tables span',
            callback: function (key, options) {
                var tableName = $(this).text()
                if (key === 'ShowFullColumns') {
                    $.executeQueryAjax(activeClassifier, activeMerchantId, activeMerchantCode, activeMerchantName, 'show full columns from ' + tableName)
                } else if (key == 'ShowCreateTable') {
                    $.showSqlAjax('show create table ' + tableName)
                } else if (key == 'RenameTable') {
                    $.appendSqlToSqlEditor('RENAME TABLE ' + tableName + ' TO ' + tableName + "_new", true, false)
                }
            },
            items: {
                ShowFullColumns: {name: 'Show Columns', icon: 'columns'},
                ShowCreateTable: {name: 'Show Create Table', icon: 'create-table'},
                RenameTable: {name: 'Rename Table', icon: 'create-table'},
            }
        })
    }

    var withColumnsCache = {}
    $.showTablesAjax = function (tid) {
        var withColumns = !withColumnsCache[tid]
        $.ajax({
            type: 'POST',
            url: contextPath + "/query",
            data: {tid: tid, sql: 'show tables', withColumns: withColumns},
            success: function (content, textStatus, request) {
                if (content && content.Error) {
                    $.alertMe(content.Error)
                    return
                }

                if (withColumns) {
                    withColumnsCache[tid] = content.TableColumns
                }
                showTables(content, withColumnsCache[tid])
                $('.tablesWrapper').show()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    $('.searchTableNames').on('keyup change', function () {
        var filter = $.trim($(this).val()).toUpperCase()

        $('.tables span').each(function (index, span) {
            var $span = $(span)
            var text = $.trim($span.text()).toUpperCase()
            var contains = text.indexOf(filter) > -1
            $span.toggle(contains)
        })
    }).focus(function () {
        $(this).select()
        $('.tablesWrapper').show()
    })

})()