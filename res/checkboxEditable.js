(function () {
    $.toggleRowEditable = function ($this) {
        var rowChecked = $this.prop('checked')
        var dataCells = $this.parents('tr').find('td.dataCell')
        if (!rowChecked) {
            dataCells.attr('contenteditable', false)
                .unbind('dblclick').unbind('blur')
            return
        }

        dataCells.dblclick(function () {
            var $this = $(this)
            if (!$this.attr('old')) {
                $this.attr('old', $this.text())
            }
            $this.attr('contenteditable', true)
                .focus()
                .keydown(function (event) {
                    var keyCode = event.keyCode || event.which
                    if (keyCode == 13 && event.ctrlKey) {
                        $this.blur()
                    }
                })
        }).blur(function () {
            var $this = $(this)
            $this.attr('contenteditable', false)
            if ($this.attr('old') == $this.text()) {
                $this.removeAttr('old').removeClass('changedCell')
            } else {
                $this.addClass('changedCell')
            }
        })
    }

    function checkboxEditableChange(resultId, checkboxEditable) {
        var edittable = checkboxEditable.prop('checked')
        checkboxEditable.parent().find('span.editButtons').toggle(edittable)
        var dataTable = checkboxEditable.parents('div.divResult').find('table.queryResult')
        dataTable.find('.chk').toggle(edittable)
        var rowCheckboxes = dataTable.find('.dataRow').find('input[type=checkbox]')
        rowCheckboxes.unbind('click')
        if (edittable) {
            rowCheckboxes.click(function (event) {
                event.stopPropagation()
                $.changeCheckAllState(resultId)
                $.toggleRowEditable($(this))
            })
        }
    }

    function bindCheckAllEvent(resultId) {
        var queryResultId = '#queryResult' + resultId
        var $checkAll = $(queryResultId + ' thead').find('input[type=checkbox]')

        $checkAll.click(function () {
            var $visibleCheckboxes = $(queryResultId + ' tbody').find('tr:visible').find('input[type=checkbox]')
            $visibleCheckboxes.prop('checked', $(this).prop('checked'))
        })
    }

    $.changeCheckAllState = function (resultId) {
        var queryResultId = '#queryResult' + resultId
        var $visibleCheckboxes = $(queryResultId + ' tbody').find('tr:visible').find('input[type=checkbox]')
        var $checkAll = $(queryResultId + ' thead').find('input[type=checkbox]')
        $checkAll.prop('checked', $visibleCheckboxes.length === $visibleCheckboxes.filter(':checked').length)
    }

    $.attachEditableEvent = function (resultId) {
        var checkboxEditable = $('#checkboxEditable' + resultId)
        checkboxEditableChange(resultId, checkboxEditable)
        checkboxEditable.click(function () {
            checkboxEditableChange(resultId, checkboxEditable)
        })

        bindCheckAllEvent(resultId)
    }
})()