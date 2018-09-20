(function () {

    function matchCellValue(cellValue, operator, operatorValue, orOperatorValues) {
        if (operator == '>=') {
            return +cellValue >= +operatorValue
        } else if (operator == '<=') {
            return +cellValue <= +operatorValue
        } else if (operator == '<>' || operator == '!=') {
            return !equalsAnyOf(cellValue, orOperatorValues)
        } else if (operator == '>') {
            return +cellValue > +operatorValue
        } else if (operator == '<') {
            return +cellValue < +operatorValue
        } else if (operator == '=') {
            return equalsAnyOf(cellValue, orOperatorValues)
        } else if (operator == 'contains') {
            return containsAnyOf(cellValue, orOperatorValues)
        }

        return false
    }

    function rowFilter(dataTable, filter) {
        var isNot = filter.startsWith("!")

        var orFilters = (isNot ? filter.substr(1) : filter).split(/\|/)
        var valueFilters = []
        for (var i = 0; i < orFilters.length; ++i) {
            var f = $.trim(orFilters[i])
            if (f !== '') valueFilters.push(f)
        }

        $('tr:gt(0)', dataTable).filter(function () {
            var found = false
            $('td.dataCell', $(this)).each(function (index, cell) {
                var text = $.trim($(cell).text()).toUpperCase()
                if (containsAnyOf(text, valueFilters)) {
                    found = true
                    return false
                }
            })
            $(this).toggle(found ? !isNot : isNot)
        })
    }

    function equalsAnyOf(text, filters) {
        return $.inArray(text, filters) >= 0
    }

    function containsAnyOf(text, filters) {
        for (var i = 0; i < filters.length; ++i) {
            if (text.indexOf(filters[i]) > -1) return true;
        }

        return false;
    }

    function fieldRowFilter(dataTable, foundColumnIndex, operator, operatorValue) {
        var orOperatorValues = operatorValue.split(/\|/)
        for (var i = 0; i < orOperatorValues.length; ++i) {
            orOperatorValues[i] = $.trim(orOperatorValues[i])
        }

        $('tr:gt(0)', dataTable).filter(function () {
            var td = $('td', $(this)).eq(foundColumnIndex)
            var text = $.trim(td.text()).toUpperCase()
            var found = matchCellValue(text, operator, operatorValue, orOperatorValues)
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
        return foundColumnIndex
    }

    $.attachSearchTableEvent = function (resultId) {
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
                var foundColumnIndex = $.findColumnIndex(dataTable, columnName)
                if (foundColumnIndex < 0) {
                    rowFilter(dataTable, filter)
                    return
                }

                fieldRowFilter(dataTable, foundColumnIndex, result.operator, result.operatorValue)
            }

            dataTable.find('tbody tr:visible').each(function (index, tr) {
                $(tr).find('td').eq(1).text(index + 1)
            }).removeAttr('rowOdd').removeClass('rowOdd').filter(':odd').addClass('rowOdd').attr('rowOdd', 'true')

        }).focus(function () {
            $(this).select()
        })
    }
})()