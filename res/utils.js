(function () {
    function tryAddSql(sqls, sql) {
        var trimSql = sql.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
        if (trimSql !== '') {
            sqls.push(trimSql)
        }
    }

    $.splitSqls = function (sqlsString, separateChar) {
        var sqls = []

        var inQuoted = false
        var pos = 0
        var len = sqlsString.length
        for (var i = 0; i < len; ++i) {
            var ch = sqlsString[i]
            if (ch === '\\') {
                ++i
            } else if (ch == '\'') {
                if (inQuoted && i + 1 < len && sqlsString[i + 1] === '\'') {
                    ++i  // jump escape for literal apostrophe, or single quote
                } else {
                    inQuoted = !inQuoted
                }
            } else if (!inQuoted && ch === separateChar) {
                tryAddSql(sqls, sqlsString.substring(pos, i))
                pos = i + 1
            }
        }

        if (pos < len) {
            tryAddSql(sqls, sqlsString.substring(pos))
        }
        return sqls
    }

    $.copyTextToClipboard = function (text) {
        var textArea = document.createElement("textarea")

        textArea.style.position = 'fixed'
        textArea.style.top = 0
        textArea.style.left = 0
        textArea.style.width = '2em'
        textArea.style.height = '2em'
        textArea.style.padding = 0
        textArea.style.border = 'none'
        textArea.style.outline = 'none'
        textArea.style.boxShadow = 'none'
        textArea.style.background = 'transparent'
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        try {
            var successful = document.execCommand('copy')
            var msg = successful ? 'successful' : 'unsuccessful'
            console.log('Copying text command was ' + msg)
        } catch (err) {
            console.log('Oops, unable to copy')
        }
        document.body.removeChild(textArea)
    }

    $.js_yyyy_mm_dd_hh_mm_ss_SSS = function () {
        var now = new Date();
        var year = "" + now.getFullYear();
        var month = "" + (now.getMonth() + 1);
        if (month.length == 1) {
            month = "0" + month;
        }
        var day = "" + now.getDate();
        if (day.length == 1) {
            day = "0" + day;
        }
        var hour = "" + now.getHours();
        if (hour.length == 1) {
            hour = "0" + hour;
        }
        var minute = "" + now.getMinutes();
        if (minute.length == 1) {
            minute = "0" + minute;
        }
        var second = "" + now.getSeconds();
        if (second.length == 1) {
            second = "0" + second;
        }
        var millis = "" + now.getMilliseconds();
        if (second.length == 1) {
            second = "00" + second;
        } else if (second.length == 2) {
            second = "0" + second;
        }
        return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second + "." + millis;
    }

    $.costTime = function (startTime) {
        var diff = Date.now() - startTime;
        var seconds = diff / 1000
        return seconds + "s"
    }

    $.escapeContextMenuCssName = function (headName) {
        var regExp = /^[0-9a-zA-Z-_]+$/;
        if (regExp.test(headName)) {
            return 'contextMenu-' + headName
        }

        var prefix = ""
        for (i = 1; i < headName.length; i++) {
            var temp = headName.substr(0, i)
            if (regExp.test(temp)) {
                prefix = temp
            } else {
                break
            }
        }

        return 'contextMenu-' + prefix + $.stringHashCode(headName)
    }

    $.stringHashCode = function (s) {
        var hash = 0, i, chr
        if (s.length === 0) return hash
        for (i = 0; i < s.length; i++) {
            chr = s.charCodeAt(i)
            hash = ((hash << 5) - hash) + chr
            hash |= 0; // Convert to 32bit integer
        }
        return hash
    }

    $.sortingTable = function (tableId, compareColumnIndex, asc, seqIndex) {
        var datas = [];
        var $tbody = $('#' + tableId + ' tbody')
        var tbody = $tbody[0]
        var tbodyLength = tbody.rows.length;
        for (var i = 0; i < tbodyLength; i++) {
            datas[i] = tbody.rows[i];
        }

        // sort by cell[index]
        datas.sort(function (a, b) {
            var compare = compareCells(a, b, compareColumnIndex)
            return asc ? compare : (-compare)
        })
        for (var i = 0; i < tbodyLength; i++) {
            // rearrange table rows by sorted rows
            datas[i].cells[seqIndex].innerText = (i + 1)
            tbody.appendChild(datas[i]);
        }

        $tbody.find('tr').removeAttr('rowOdd').removeClass('rowOdd').filter(':odd').addClass('rowOdd').attr('rowOdd', 'true')
    }

    $.filterSortTableByValues = function ($resultTable, compareColumnIndex, filteredValues) {
        var $tbody = $resultTable.find('tbody')
        var tbody = $tbody[0]
        var tbodyLength = tbody.rows.length;

        var rows = []
        var filteredRows = []
        for (var i = 0; i < tbodyLength; i++) {
            var row = tbody.rows[i]

            var cell = row.cells[compareColumnIndex]
            var cellVal = cell ? $.trim(cell.innerText) : ""

            if (filteredValues[cellVal]) {
                rows.splice(filteredValues[cellVal] - 1, 0, row)
            } else {
                filteredRows.push(row)
            }
        }

        for (var i = 0; i < rows.length; i++) {
            // rearrange table rows by sorted rows
            rows[i].cells[1].innerText = (i + 1)
            $(filteredRows).toggle(true)
            tbody.appendChild(rows[i])
        }

        for (var i = 0; i < filteredRows.length; i++) {
            $(filteredRows).toggle(false)
            filteredRows[i].cells[1].innerText = (i + 1)
            tbody.appendChild(filteredRows[i])
        }

        $tbody.find('tr').removeAttr('rowOdd').removeClass('rowOdd')
            .filter(':odd').addClass('rowOdd').attr('rowOdd', 'true')
    }


    function compareCells(aRow, bRow, compareColumnIndex) {
        var aCell = aRow.cells[compareColumnIndex]
        var aVal = aCell ? aCell.innerText : ""
        var bCell = bRow.cells[compareColumnIndex]
        var bVal = bCell ? bCell.innerText : ""

        aVal = aVal.replace(/\,/g, '')
        bVal = bVal.replace(/\,/g, '')

        if (aVal.match(/^[0-9]+$/) && bVal.match(/^[0-9]+$/)) {
            return parseFloat(aVal) - parseFloat(bVal)
        } else if (aVal < bVal) {
            return -1
        } else if (aVal > bVal) {
            return 1
        } else {
            return 0
        }
    }

    $.csvString = function (value) {
        if (!value || "(null)" === value) return '""'
        // https://superuser.com/questions/861964/how-do-i-stop-excel-from-converting-value-0503e000-to-5-03e02-automatically
        // Avoiding Excel automatically tries to interpret the cell as having a scientific number
        // which is why you are seeing 5.03E+02 instead of 0503E000.
        // If you can convert or control the CSV format, you can force a column to parse as text in Excel
        // by wrapping it in double quotes and prepending an equals sign.
        // if (value.match(/^[0-9]+$/)) return '="' + value + '"'

        var result = value.replace(/"/g, '""');
        return result.search(/("|,|\n)/g) < 0 ? result : '"' + result + '"'
    }


    $.replaceOrPrependResult = function (resultId, oldResultId, html) {
        if (resultId === oldResultId) {
            $('#executionResultDiv' + oldResultId).replaceWith(html)
        } else {
            $(html).prependTo($('.result'))
        }
    }

    $.firstUpperWord = function (sql) {
        var prefix = /\/\*.*?\*\/(.+)/
        var prefixResult = prefix.exec(sql)
        if (prefixResult) {
            sql = prefixResult[1]
        }

        var s = $.trim(sql)
        var firstWord = s.replace(/\s.*/, '')
        return firstWord.toUpperCase()
    }

    $.incr = function (b) {
        var a = b + ''
        var l = a.length;
        if (l <= 10) return +a + 1 + ''
        return a.substr(0, l - 10) + (+a.substr(l - 10) + 1)
    }

    $.clipboardText = function (e) {
        if (e.clipboardData || e.originalEvent.clipboardData) {
            return (e.originalEvent || e).clipboardData.getData('text/plain')
        } else if (window.clipboardData) {
            return window.clipboardData.getData('Text')
        }

        $.alertMe("No clipboard available")
        return ''
    }

    $.alertMe = function (content) {
        $.dialog({
            title: "提示",
            content: content
        })
    }

    $.promptMe = function (title, callback, demo) {
        $.confirm({
            title: title || 'Prompt!',
            content: '' +
                '<div>' +
                '<textarea class="input" rows="30" cols="100" >' + (demo || '') + '</textarea>' +
                '</div>',
            buttons: {
                formSubmit: {
                    text: 'Submit',
                    btnClass: 'btn-blue',
                    action: function () {
                        var input = this.$content.find('.input').val()
                        callback(input)
                    }
                },
                cancel: function () {
                    //close
                },
            },
            onContentReady: function () {
                // bind to events
                var jc = this
                this.$content.find('form').on('submit', function (e) {
                    // if the user submits the form by pressing enter in the field.
                    e.preventDefault()
                    jc.$$formSubmit.trigger('click'); // reference the button and click it
                });
            }
        });
    }

    $.confirmMe = function (title, content, okFunc) {
        // https://github.com/craftpip/jquery-confirm
        $.confirm({
            title: title,
            content: content,
            type: 'blue',
            buttons: {
                ok: {
                    text: "ok!",
                    btnClass: 'btn-primary',
                    keys: ['enter'],
                    action: okFunc
                },
                cancel: function () {

                }
            }
        })
    }
})()