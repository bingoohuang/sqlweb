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
})()