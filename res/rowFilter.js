(function () {

    function matchCellValue(cellValue, operator, operatorValue) {
        if (operator == '>=') {
            return +cellValue >= +operatorValue
        } else if (operator == '<=') {
            return +cellValue <= +operatorValue
        } else if (operator == '<>' || operator == '!=') {
            return cellValue != operatorValue
        } else if (operator == '>') {
            return +cellValue > +operatorValue
        } else if (operator == '<') {
            return +cellValue < +operatorValue
        } else if (operator == '=') {
            return cellValue == operatorValue
        } else if (operator == 'contains') {
            return cellValue.indexOf(operatorValue) > -1
        }

        return false
    }

    function rowFilter(dataTable, filter) {
        $('tr:gt(0)', dataTable).filter(function () {
            var found = false
            $('td.dataCell', $(this)).each(function (index, cell) {
                var text = $.trim($(cell).text()).toUpperCase()
                if (text.indexOf(filter) > -1) {
                    found = true
                    return false
                }
            })
            $(this).toggle(found)
        })
    }

    function fieldRowFilter(dataTable, foundColumnIndex, operator, operatorValue) {
        var headRow = dataTable.find('tr.headRow').first().find('td')
        $('tr:gt(0)', dataTable).filter(function () {
            var td = $('td', $(this)).eq(foundColumnIndex)
            var text = $.trim(td.text()).toUpperCase()
            var found = matchCellValue(text, operator, operatorValue)
            $(this).toggle(found)
        })
    }

    function parseOperatorValue(operatorValue) {
        if (operatorValue.indexOf('>=') == 0) {
            return {operator: '>=', operatorValue: $.trim(operatorValue.substring(2))}
        } else if (operatorValue.indexOf('<=') == 0) {
            return {operator: '<=', operatorValue: $.trim(operatorValue.substring(2))}
        } else if (operatorValue.indexOf('!=') == 0 || operatorValue.indexOf('<>') == 0) {
            return {operator: '!=', operatorValue: $.trim(operatorValue.substring(2))}
        } else if (operatorValue.indexOf('>') == 0) {
            return {operator: '>', operatorValue: $.trim(operatorValue.substring(1))}
        } else if (operatorValue.indexOf('<') == 0) {
            return {operator: '<', operatorValue: $.trim(operatorValue.substring(1))}
        } else if (operatorValue.indexOf('=') == 0) {
            return {operator: '=', operatorValue: $.trim(operatorValue.substring(1))}
        } else {
            return {operator: 'contains', operatorValue: operatorValue}
        }
    }

    $.findColumnIndex = function (dataTable, columnName) {
        var headRow = dataTable.find('tr.headRow').first().find('td')
        var foundColumnIndex = -1
        headRow.each(function (index, td) {
            if ($(td).text().toUpperCase() == columnName) {
                foundColumnIndex = index
                return false
            }
        })
        return foundColumnIndex;
    }

    $.attachSearchTableEvent = function (resultId, seqIndex) {
        $('#searchTable' + resultId).on('keyup change', function () {
            var dataTable = $(this).parents('div.divResult').find('table.queryResult')

            var filter = $.trim($(this).val()).toUpperCase()
            var seperatePos = filter.indexOf(':')
            if (seperatePos == -1) {
                rowFilter(dataTable, filter)
            } else {
                var columnName = $.trim(filter.substring(0, seperatePos))
                if (seperatePos == filter.length - 1) {
                    rowFilter(dataTable, filter)
                    return
                }

                var operatorValue = $.trim(filter.substring(seperatePos + 1))
                var result = parseOperatorValue(operatorValue)
                if (result.operatorValue == '') {
                    rowFilter(dataTable, filter)
                    return
                }
                var foundColumnIndex = $.findColumnIndex(dataTable, columnName);
                if (foundColumnIndex < 0) {
                    rowFilter(dataTable, filter)
                    return
                }

                fieldRowFilter(dataTable, foundColumnIndex, result.operator, result.operatorValue)
            }

            dataTable.find('tbody tr:visible').each(function (index, tr) {
                $(tr).find('td').eq(seqIndex).text(index + 1)
            }).removeAttr('rowOdd').removeClass('rowOdd').filter(':odd').addClass('rowOdd').attr('rowOdd', 'true')

            $.changeCheckAllState(resultId)
        }).focus(function () {
            $(this).select()
        })
    }
})()