(function () {
    $.toggleRowEditable = function ($this) {
        var rowChecked = $this.prop('checked')
        var $tr = $this.parents('tr')
        switchRowEditable(rowChecked, $tr)
    }

    function switchRowEditable(rowChecked, $tr) {
        var dataCells = $tr.find('td.dataCell:not(.textAreaTd)')
        var textareas = $tr.find('textarea')
        if (!rowChecked) {
            dataCells.attr('contenteditable', false).unbind('blur')
            textareas.prop("readonly", true).unbind('blur')
            return
        }

        textareas.prop("readonly", false).click(function () {
            var $this = $(this)
            var $td = $this.parent()
            if (!$td.attr('old')) {
                $td.attr('old', $this.val())
            }
            $td.focus().keydown(function (event) {
                var keyCode = event.keyCode || event.which
                if (keyCode == 13 && event.ctrlKey) {
                    $this.blur()
                }
            })
        }).blur(function () {
            var $this = $(this)
            var $td = $this.parent()
            $this.val($.trim($this.val()))
            if ($td.attr('old') == $this.val()) {
                $td.removeAttr('old').removeClass('changedCell')
            } else {
                $td.addClass('changedCell')
            }
        })

        dataCells.attr('contenteditable', true).click(function () {
            var $this = $(this)
            if (!$this.attr('old')) {
                $this.attr('old', $this.text())
            }
            $this.focus().keydown(function (event) {
                var keyCode = event.keyCode || event.which
                if (keyCode == 13 && event.ctrlKey) {
                    $this.blur()
                }
            })
        }).blur(function () {
            var $this = $(this)
            $this.text($.trim($this.text()))
            if ($this.attr('old') ==  $this.text()) {
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
            var $trs = $(queryResultId + ' tbody').find('tr:visible');
            var $visibleCheckboxes = $trs.find('input[type=checkbox]')
            var $this = $(this);
            var checkedOn = $this.prop('checked');
            $visibleCheckboxes.prop('checked', checkedOn)
            $trs.each(function () {
                switchRowEditable(checkedOn, $(this))
            })
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