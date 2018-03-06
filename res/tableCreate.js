(function () {
    function copyRows($checkboxes) {
        $checkboxes.each(function (index, checkbox) {
            var $tr = $(checkbox).parents('tr')
            $tr.find(':checked').prop("checked", false)
            var $clone = $tr.clone().addClass('clonedRow')
            $clone.insertAfter($tr)
            $clone.find('input[type=checkbox]').click($.toggleRowEditable).click()
        })
    }

    function attachDeleteRowsEvent() {
        var cssChoser = '#queryResult' + queryResultId + ' :checked'
        $('#deleteRows' + queryResultId).click(function () {
            $(cssChoser).parents('tr').addClass('deletedRow')
        })
    }

    function attachCopyRowsEvent() {
        var thisQueryResult = queryResultId
        $('#copyRow' + thisQueryResult).click(function () {
            var checkboxes = $('#queryResult' + thisQueryResult + ' :checked')
            if (checkboxes.length == 0) {
                alert('please specify which row to copy')
            } else {
                copyRows($(checkboxes))
            }
        })
    }

    function attachOpsResultDivEvent() {
        var divId = '#executionResultDiv' + queryResultId
        $('#closeResult' + queryResultId).click(function () {
            $(divId).remove()
        })
        var resultId = queryResultId

        $('#reExecuteSql' + queryResultId).click(function () {
            var sql = $(divId).find('.sqlTd').text()
            $.executeQueryAjax(sql, resultId)
        })
    }

    function attachExpandRowsEvent() {
        var buttonId = '#expandRows' + queryResultId
        var collapseDiv = '#collapseDiv' + queryResultId

        $(buttonId).click(function () {
            if ($(this).text() == 'Expand Rows') {
                $(collapseDiv).removeClass('collapseDiv')
                $(this).text('Collapse Rows')
            } else {
                $(collapseDiv).addClass('collapseDiv')
                $(this).text('Expand Rows')
            }
        }).toggle($(collapseDiv).height() >= 300)
    }

    $.tableCreate = function (result, sql, resultId) {
        var rowUpdateReady = result.TableName && result.TableName != ""

        ++queryResultId
        var contextMenuHolder = {}
        var table = $.createResultTableHtml(result, sql, rowUpdateReady, queryResultId, contextMenuHolder)
        if (resultId && resultId > 0) {
            $('#executionResultDiv' + resultId).html(table)
        } else {
            $(table).prependTo($('.result'))
        }

        $('#queryResult' + queryResultId + ' tr:even').addClass('rowEven')
        $.attachSearchTableEvent(queryResultId)
        attachExpandRowsEvent()
        attachOpsResultDivEvent()
        $.createLinkToTableContextMenu(contextMenuHolder)

        if (rowUpdateReady) {
            $.attachEditableEvent(queryResultId)
            attachCopyRowsEvent()
            attachDeleteRowsEvent()
            $.attachRowTransposesEvent(queryResultId)
            $.attachSaveUpdatesEvent(result, queryResultId)
        }
    }
})()
