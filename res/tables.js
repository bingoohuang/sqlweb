(function () {
    function showTables(result) {
        var resultHtml = ''
        if (result.Rows && result.Rows.length > 0) {
            for (var i = 0; i < result.Rows.length; i++) {
                resultHtml += '<span>' + result.Rows[i][1] + '</span>'
            }
        }
        $('.tables').html(resultHtml)
        $('.searchTableNames').change()
        $.ReloadConfig()

        $.contextMenu({
            selector: '.tables span',
            callback: function (key, options) {
                var tableName = $(this).text()
                if (key === 'ShowFullColumns') {
                    $.executeQueryAjax(activeMerchantId, activeMerchantName, 'show full columns from ' + tableName)
                } else if (key == 'ShowCreateTable') {
                    $.showCreateTableAjax(tableName)
                }
            },
            items: {
                ShowFullColumns: {name: 'Show Columns', icon: 'columns'},
                ShowCreateTable: {name: 'Show Create Table', icon: 'create-table'},
            }
        })
    }

    $.showTablesAjax = function (activeMerchantId) {
        $.ajax({
            type: 'POST',
            url: pathname + "/query",
            data: {tid: activeMerchantId, sql: 'show tables'},
            success: function (content, textStatus, request) {
                showTables(content)
                $('.tablesWrapper').show()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
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

    $('.tables').on('click', 'span', function (event) {
        var tableName = $(this).text()
        $.executeQueryAjax(activeMerchantId, activeMerchantName, 'select * from ' + tableName)
    })
})()