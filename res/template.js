(function () {

    $.templateParse = function (templateStr, option) {
        var openTag = option && option.openTag || '{{'
        var closeTag = option && option.closeTag || '}}'

        var index = 0
        var variables = {}

        while (index < templateStr.length) {
            var fromIndex = templateStr.indexOf(openTag, index)
            if (fromIndex < 0) break

            var toIndex = templateStr.indexOf(closeTag, fromIndex + openTag.length)
            if (toIndex < 0) break

            var rawTag = templateStr.substring(fromIndex + openTag.length, toIndex)
            var tag = rawTag.trim()

            if (!variables[tag]) {
                variables[tag] = []
            }
            variables[tag].push({tag: tag, fromIndex: fromIndex, toIndex: toIndex + closeTag.length})
            index = toIndex + closeTag.length
        }

        var keys = []
        for (var key in variables) {
            keys.push(key)
        }

        return keys
    }

    $.templateEval = function (templateStr, values, option) {
        var openTag = option && option.openTag || '{{'
        var closeTag = option && option.closeTag || '}}'

        var evalResult = []
        var index = 0

        while (index < templateStr.length) {
            var fromIndex = templateStr.indexOf(openTag, index)
            if (fromIndex < 0) break

            var toIndex = templateStr.indexOf(closeTag, fromIndex + openTag.length)
            if (toIndex < 0) break

            var rawTag = templateStr.substring(fromIndex + openTag.length, toIndex)
            var tag = rawTag.trim()

            evalResult.push(templateStr.substring(index, fromIndex))
            evalResult.push(values[tag] || '')
            index = toIndex + closeTag.length
        }

        if (index < templateStr.length) {
            evalResult.push(templateStr.substring(index))
        }

        return evalResult.join('')
    }

})()