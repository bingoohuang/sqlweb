(function () {
    const mac = CodeMirror.keyMap.default === CodeMirror.keyMap.macDefault; // 判断是否为Mac

    const runKey = (mac ? "Cmd" : "Ctrl") + "-Enter";
    const extraKeys = {};
    extraKeys[runKey] = function (cm) {
        const executeQuery = $('.executeQuery');
        if (!executeQuery.prop("disabled")) executeQuery.click()
    }

    var codeMirror = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: 'text/x-mysql',
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets: true,
        extraKeys: extraKeys,
        hint: CodeMirror.hint.sql
    })

    $.sqlCodeMirror = codeMirror

    $.getEditorText = function () {
        const selected = codeMirror.somethingSelected();
        return selected ? codeMirror.getSelection() : codeMirror.getValue()
    }

    $.contextMenu({
        selector: '#sqlwebDiv .CodeMirror',
        zIndex: 10,
        callback: function (key, options) {
            const selected = codeMirror.somethingSelected();
            if (key === 'FormatSql') {
                const sql = $.getEditorText();
                const formattedSql = sqlFormatter.format(sql, {language: 'sql'});

                if (selected) {
                    codeMirror.replaceSelection(formattedSql)
                } else {
                    codeMirror.setValue(formattedSql)
                }
            } else if (key === 'ClearSql') {
                codeMirror.setValue('')
            } else if (key === 'RunSql') {
                const $executeQuery = $('.executeQuery');
                if ($executeQuery.prop('disabled') === false) {
                    $executeQuery.click()
                }
            } else if (key === 'ShowFullColumns') {
                let tableName;
                if (selected) {
                    tableName = codeMirror.getSelection()
                } else {
                    const word = codeMirror.findWordAt(codeMirror.getCursor());
                    tableName = codeMirror.getRange(word.anchor, word.head)
                }
                $.executeQueryAjax(activeClassifier, activeMerchantId, activeMerchantCode, activeMerchantName,
                    'show full columns from ' + tableName)
            } else if (key === 'ParseTemplate') {
                const query = $.getEditorText();
                $.templateSql(query)
            }
        },
        items: {
            RunSql: {name: 'Run SQL', icon: 'run'},
            FormatSql: {name: 'Format SQL', icon: 'format'},
            ClearSql: {name: 'Clear SQL', icon: 'clear'},
            ShowFullColumns: {name: 'Show Columns', icon: 'columns'},
            ParseTemplate: {name: 'Parse Template', icon: 'columns'},
        }
    })

    $.getEditorSql = function () {
        return $.getEditorText()
    }

    $('.executeQuery').prop("disabled", true).click(function () {
        const sql = $.getEditorSql();
        if ($.trim(sql) === '') {
            $.alertMe("Please input sql!")
            return
        }

        $.executeMultiSqlsAjaxOptions({
            sql: sql,
            confirmUpdate: false,
            callback: function () {
                $('#refreshTables').click()
            }
        })
    })

    // refer : https://codemirror.net/mode/toml/index.html
    var yamlCodeMirror = CodeMirror.fromTextArea(document.getElementById("yamlEditor"), {
        mode: 'text/yaml', lineNumbers: true
    })

    var currentSparkItem = null

    $('#yamlEditorDiv .Save').click(function () {
        var url = contextPath + "/saveDapsOpptions"
        var data = {data: yamlCodeMirror.getValue()}
        if (currentSparkItem === 'EditDapsConfig') {
            url = contextPath + "/saveDapsConfigFile"
            data.connName = activeMerchantId.substring(5)
        }
        $.ajax({
            type: 'POST',
            url: url,
            data: data,
            success: function (content) {
                if (content.OK === "OK") {
                    $('#yamlEditorDiv').toggle()
                    $('#sqlwebDiv').toggle()
                } else {
                    $.alertMe(content.OK)
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })

    $('#yamlEditorDiv .Close').click(function () {
        $('#yamlEditorDiv').toggle()
        $('#sqlwebDiv').toggle()
        currentSparkItem = null
    })

    $.contextMenu({
        zIndex: 10,
        selector: '#multiTenantsDivSpark',
        trigger: 'left',
        callback: function (key, options) {
            currentSparkItem = key
            if (key === 'EditDapsConfig') {
                if (!activeMerchantId || !activeMerchantId.startsWith("daps-")) {
                    $.alertMe("当前不是 daps 连接")
                    return
                }
                connName = activeMerchantId.substring(5)
                $.ajax({
                    type: 'POST',
                    url: contextPath + "/loadDapsConfigFile",
                    data: {connName: connName},
                    success: function (content) {
                        $('#yamlEditorDiv').toggle()
                        $('#sqlwebDiv').toggle()
                        yamlCodeMirror.setValue(content.Data)
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
                    }
                })

            } else if (key === 'EditDapsOptions') {
                $.ajax({
                    type: 'POST',
                    url: contextPath + "/loadDapsOpptions",
                    success: function (content) {
                        $('#yamlEditorDiv').toggle()
                        $('#sqlwebDiv').toggle()
                        yamlCodeMirror.setValue(content.Data)
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $.alertMe(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
                    }
                })
            }
        },
        items: {
            EditDapsOptions: {name: "编辑 DAPS 配置", icon: "columns"},
            EditDapsConfig: {name: "编辑 DAPS 策略", icon: "columns"},
        }
    })
})()