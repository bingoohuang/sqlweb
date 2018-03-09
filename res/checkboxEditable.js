(function () {
    $.toggleRowEditable = function () {
        var rowChecked = $(this).prop('checked')
        var dataCells = $(this).parents('tr').find('td.dataCell')
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

    function checkboxEditableChange(checkboxEditable) {
        var edittable = checkboxEditable.prop('checked')
        checkboxEditable.parent().find('span.editButtons').toggle(edittable)
        var dataTable = checkboxEditable.parents('div.divResult').find('table.queryResult')
        dataTable.find('.chk').toggle(edittable)
        var rowCheckboxes = dataTable.find('.dataRow').find('input[type=checkbox]')
        rowCheckboxes.unbind('click')
        if (edittable) {
            rowCheckboxes.click($.toggleRowEditable)
        }
    }

    $.attachEditableEvent = function (queryResultId) {
        var checkboxEditable = $('#checkboxEditable' + queryResultId)
        checkboxEditableChange(checkboxEditable)
        checkboxEditable.click(function () {
            checkboxEditableChange(checkboxEditable)
        })
    }
})()