(function () {
    function transposeRows(resultId, $chosenRows) {
        var rowHtml = '<button id="returnToNormalView' + resultId + '">Return to Normal View</button>'
            + '<table><tr><td>Column Name</td>'

        $chosenRows.each(function (index, tr) {
            rowHtml += '<td>#' + $(tr).find('td:eq(1)').text() + '</td>'
        })
        rowHtml += '</tr>'

        var table = $('#queryResult' + resultId)
        var headRow = table.find('tr.headRow').first().find('td')

        for (var i = 2; i < headRow.length; ++i) {
            rowHtml += '<tr><td>' + $(headRow[i]).text() + '</td>'
            $chosenRows.each(function (index, tr) {
                rowHtml += '<td>' + $(tr).find('td').eq(i).text() + '</td>'
            })
            rowHtml += '</tr>'
        }

        rowHtml += '</table>'

        var $divTranspose = $('#divTranspose' + resultId)
        $divTranspose.html(rowHtml).show()
        var $divResult = $('#divResult' + resultId)
        $divResult.hide()

        $('#returnToNormalView' + resultId).click(function () {
            $divTranspose.hide()
            $divResult.show()
        })
    }

    $.attachRowTransposesEvent = function (resultId) {
        $('#rowTranspose' + resultId).click(function () {
            var tbody = $('#queryResult' + resultId + ' tbody');
            var $chosenRows = tbody.find('tr.highlightRow:visible')
            if ($chosenRows.length == 0) {
                $chosenRows = tbody.find('tr:visible')
            }
            transposeRows(resultId, $chosenRows)
        })
    }
})()