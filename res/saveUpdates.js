(function () {
    $.attachSaveUpdatesEvent = function (tid, result, resultId) {
        $('#saveUpdates' + resultId).click(function () {
            var table = $('#queryResult' + resultId)
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
                    var deleteSql = 'delete from ' + $.wrapFieldName(result.TableName) + ' '
                    deleteSql += $.createWherePart(result, headRow, cells)
                    sqls[sqls.length] = deleteSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else {
                    var updateSql = $.createUpdateSetPart(cells, result, headRow)
                    if (updateSql != null) {
                        updateSql += $.createWherePart(result, headRow, cells)
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
                $.executeUpdate(tid, sqlRowIndices, joinedSqls, $rows)
            }
        })
    }

    function cellValue(cells, seq) {
        return $.cellValue(cells.eq(seq))
    }

    function createAddColumn(cells, result, $rows, index) {
        var dataType = cellValue(cells, 2)
        var nullable = cellValue(cells, 4)
        var defaultValue = cellValue(cells, 6)
        var commentValue = cellValue(cells, 9)
        var tableName = $.wrapFieldName(result.TableName)
        var wrapFieldName = $.wrapFieldName(cellValue(cells, 1))
        return 'ALTER TABLE ' + tableName + ' ADD COLUMN ' + wrapFieldName + ' ' + dataType
            + ("YES" === nullable ? " NULL " : " NOT NULL ") + ("(null)" !== defaultValue ? " DEFAULT '" + defaultValue + "' " : "")
            + ("" === commentValue ? "" : " COMMENT '" + $.escapeSqlValue(commentValue) + "' ")
            + (index === 0 ? (' BEFORE ' + $.wrapFieldName(cellValue($rows.eq(1).find('td.dataCell'), 1)))
                : (' AFTER ' + $.wrapFieldName(cellValue($rows.eq(index - 1).find('td.dataCell'), 1))))
    }

    function createModifyColumn(cells, result) {
        var changedCell = cells.eq(1).hasClass('changedCell')
        var dataType = cellValue(cells, 2)
        var nullable = cellValue(cells, 4)
        var defaultValue = cellValue(cells, 6)
        var commentValue = cellValue(cells, 9)
        var tableName = $.wrapFieldName(result.TableName)
        var wrapFieldName = $.wrapFieldName(cellValue(cells, 1))
        var changeOrModifyColumn = changedCell ? ' CHANGE COLUMN ' + $.wrapFieldName(cells.eq(1).attr('old')) + '  ' : ' MODIFY COLUMN '
        return 'ALTER TABLE ' + tableName + changeOrModifyColumn + wrapFieldName + ' ' + dataType
            + ("YES" === nullable ? " NULL " : " NOT NULL ") + ("(null)" !== defaultValue ? " DEFAULT '" + defaultValue + "' " : "")
            + ("" === commentValue ? "" : " COMMENT '" + $.escapeSqlValue(commentValue) + "' ")
    }

    function createDropColumn(result, headRow, cells) {
        var tableName = $.wrapFieldName(result.TableName)
        var wrapFieldName = $.wrapFieldName(cellValue(cells, 1))
        return 'ALTER TABLE ' + tableName + ' DROP COLUMN ' + wrapFieldName
    }

    $.attachDdlEvent = function (tid, result, resultId) {
        $('#saveUpdates' + resultId).click(function () {
            var table = $('#queryResult' + resultId)
            var headRow = table.find('tr.headRow').first().find('td')

            var sqls = []
            var sqlRowIndices = []
            var $rows = table.find('tr.dataRow')
            $rows.each(function (index, row) {
                var $row = $(row)
                var cells = $row.find('td.dataCell')
                if ($row.hasClass('clonedRow')) {
                    var addColumnSql = createAddColumn(cells, result, $rows, index)
                    sqls[sqls.length] = addColumnSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else if ($row.hasClass('deletedRow')) {
                    var dropColumnSql = createDropColumn(result, headRow, cells)
                    sqls[sqls.length] = dropColumnSql
                    sqlRowIndices[sqlRowIndices.length] = index
                } else {
                    var foundOld = false
                    cells.each(function (jndex, cell) {
                        if ($(this).attr('old') || $(this).hasClass('changedCell')) {
                            foundOld = true
                            return false
                        }
                    })
                    if (foundOld) {
                        var modifyColumnSql = createModifyColumn(cells, result)
                        sqls[sqls.length] = modifyColumnSql
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
                $.executeUpdate(tid, sqlRowIndices, joinedSqls, $rows, true)
            }
        })
    }
})()