(function () {
    $.attachSaveUpdatesEvent = function(result, queryResultId) {
        var thisQueryResult = queryResultId
        $('#saveUpdates' + thisQueryResult).click(function () {
            var table = $('#queryResult' + thisQueryResult)
            var headRow = table.find('tr.headRow').first().find('td')

            var sqls = []
            var sqlRowIndices = []
            var $rows = table.find('tr.dataRow')
            $rows.each(function (index, row) {
                var $row = $(row)
                var cells = $row.find('td.dataCell')
                if ($row.hasClass('clonedRow')) {
                    var insertSql = $.createInsert(cells, result)
                    sqls[sqls.length] = insertSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else if ($row.hasClass('deletedRow')) {
                    var deleteSql = 'delete from ' + result.TableName + ' '
                    deleteSql = $.createWherePart(deleteSql, result, headRow, cells)
                    sqls[sqls.length] = deleteSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else {
                    var updateSql = $.createUpdateSetPart(cells, result, headRow)

                    if (updateSql != null) {
                        updateSql = $.createWherePart(updateSql, result, headRow, cells)
                        sqls[sqls.length] = updateSql
                        sqlRowIndices[sqlRowIndices.length] = index
                    }
                }
            })
            if (sqls.length == 0) {
                alert('There is no changes to save!')
                return
            }

            var joinedSqls = sqls.join(';\n')
            if (confirm(joinedSqls + ';\n\nAre you sure to save ?')) {
                $.executeUpdate(sqlRowIndices, joinedSqls, $rows)
            }
        })
    }
})()