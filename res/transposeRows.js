(function () {
    function transposeRows(queryResultId, checkboxes) {
        var rowHtml = '<button id="returnToNormalView' + queryResultId + '">Return to Normal View</button>'
            + '<table><tr><td>Column Name</td>'

        checkboxes.each(function (index, chk) {
            rowHtml += '<td>#' + $(chk).parents('tr').find('td:eq(1)').text() + '</td>'
        })
        rowHtml += '</tr>'

        var table = $('#queryResult' + queryResultId)
        var headRow = table.find('tr.headRow').first().find('td')

        for (var i = 2; i < headRow.length; ++i) {
            rowHtml += '<tr><td>' + $(headRow[i]).text() + '</td>'
            checkboxes.each(function (chkIndex, chk) {
                rowHtml += '<td>' + $(chk).parents('tr').find('td').eq(i).text() + '</td>'
            })
            rowHtml += '</tr>'
        }

        rowHtml += '</table>'

        var $divTranspose = $('#divTranspose' + queryResultId)
        $divTranspose.html(rowHtml).show()
        var $divResult = $('#divResult' + queryResultId)
        $divResult.hide()

        $('#returnToNormalView' + queryResultId).click(function () {
            $divTranspose.hide()
            $divResult.show()
        })
    }

    $.attachRowTransposesEvent = function (queryResultId) {
        var thisQueryResult = queryResultId
        $('#rowTranspose' + thisQueryResult).click(function () {
            var checkboxes = $('#queryResult' + thisQueryResult + ' :checked')
            transposeRows(thisQueryResult, checkboxes)
        })
    }
})()