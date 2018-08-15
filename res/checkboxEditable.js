(function () {
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
        $('#queryResult' + resultId).find('tbody tr').each(function (i, tr) {
            switchRowEditable(edittable, $(tr))
        })
    }

    $.attachEditableEvent = function (resultId) {
        var rid = resultId
        var checkboxEditable = $('#checkboxEditable' + rid)
        checkboxEditable.click(function () {
            checkboxEditableChange(rid, checkboxEditable)
        })
    }
})()