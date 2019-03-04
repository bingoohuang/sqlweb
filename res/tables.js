(function () {
    $.ExcludedIntelliSenseTriggerKeys = {
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

    $.isCharForShowHint = function (str) {
        return str.length === 1 && str.match(/[a-z._0-9]/i)
    }

    $.withColumnsCache = {}

    $.createTableColumns = function(tid) {
        var tableColumnsWithComments = $.withColumnsCache[tid]
        var tableColumns = {}

        for (var tableName in tableColumnsWithComments) {
            if (tableColumnsWithComments.hasOwnProperty(tableName)) {
                var columnWithComments = tableColumnsWithComments[tableName]
                var columnNames = []
                for (var i = 0; i < columnWithComments.length; i += 2) {
                    columnNames.push(columnWithComments[i])
                }

                tableColumns[tableName] = columnNames
            }
        }

        return tableColumns
    }


    $.findTableComment = function(tid, tableName) {
        var withColumns = $.withColumnsCache[tid]
        if (withColumns) {
            return withColumns[tableName + '_TABLE_COMMENT'][0]
        }

        return ""
    }

    $.createJavaBeanFieldNamesList = function(tid, tableName) {
        var fieldProperties = ''

        var columnWithComments = $.withColumnsCache[tid][tableName]
        for (var i = 0, ii = columnWithComments.length; i < ii; i += 2) {
            var fieldName = columnWithComments[i]
            if (fieldName.toLowerCase().indexOf("time") >= 0) {
                fieldProperties += '    private DateTime '
            } else {
                fieldProperties += '    private String '
            }


            fieldProperties += $.camelCased(fieldName) + ';'

            var fieldComment = columnWithComments[i + 1]
            if (fieldComment !== "") {
                fieldProperties += ' // ' + $.mergeLines(fieldComment)
            }

            fieldProperties += '\n'
        }

        return fieldProperties
    }

})()