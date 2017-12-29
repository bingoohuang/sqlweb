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
    }

    function showTablesAjax(activeMerchantId) {
        $.ajax({
            type: 'POST',
            url: pathname + "/query",
            data: {tid: activeMerchantId, sql: 'show tables'},
            success: function (content, textStatus, request) {
                showTables(content)
                showTablesDiv()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    }

    function hideTablesDiv() {
        $('.tablesWrapper').hide()
        $('.hideTables').text('Show Tables')
        $('.searchTableNames').hide()
    }

    $.hideTablesDiv = hideTablesDiv

    function showTablesDiv() {
        $('.tablesWrapper').show()
        $('.hideTables').text('Hide Tables')
        $('.searchTableNames').show()
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
    })

    $.showTablesAjax = showTablesAjax

    $('.tables').on('click', 'span', function (event) {
        var $button = $(this)
        var tableName = $(this).text()
        if ($button.data('alreadyclicked')) {
            $button.data('alreadyclicked', false) // reset
            if ($button.data('alreadyclickedTimeout')) {
                clearTimeout($button.data('alreadyclickedTimeout')) // prevent this from happening
            }
            $.executeSql('show full columns from ' + tableName)
            hideTablesDiv()
        } else {
            $button.data('alreadyclicked', true)
            var alreadyclickedTimeout = setTimeout(function () {
                $button.data('alreadyclicked', false) // reset when it happens
                $.executeSql('select * from ' + tableName)
                hideTablesDiv()
            }, 300) // <-- dblclick tolerance here
            $button.data('alreadyclickedTimeout', alreadyclickedTimeout) // store this id to clear if necessary
        }
        return false
    })


    $('.hideTables').click(function () {
        var visible = $('.tablesWrapper').toggle($(this).text() != 'Hide Tables').is(":visible")
        $(this).text(visible ? 'Hide Tables' : 'Show Tables')
        $('.searchTableNames').toggle(visible)
    })
})()