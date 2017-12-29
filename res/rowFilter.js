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

    function fieldRowFilter(dataTable, columnName, operator, operatorValue) {
        var headRow = dataTable.find('tr.headRow').first().find('td')
        $('tr:gt(0)', dataTable).filter(function () {
            var found = false
            $('td.dataCell', $(this)).each(function (index, cell) {
                var text = $.trim($(cell).text()).toUpperCase()
                var fieldName = $(headRow.get(index + 1)).text()
                if ((columnName == "" || columnName == fieldName) && matchCellValue(text, operator, operatorValue)) {
                    found = true
                    return false
                }
            })
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

    $.attachSearchTableEvent = function(queryResultId) {
        $('#searchTable' + queryResultId).on('keyup change', function () {
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


                var headRow = dataTable.find('tr.headRow').first().find('td')
                var foundColumn = false
                headRow.each(function (index, td) {
                    if ($(td).text() == columnName) {
                        foundColumn = true
                        return false
                    }
                })
                if (!foundColumn) {
                    rowFilter(dataTable, filter)
                    return
                }

                fieldRowFilter(dataTable, columnName, result.operator, result.operatorValue)
            }
        }).focus(function () {
            $(this).select()
        })
    }
})()