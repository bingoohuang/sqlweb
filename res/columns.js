(function () {
    $.attachHighlightColumnEvent = function (resultId) {
        var $resultTable = $('#queryResult' + resultId)
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').click(function () {
                var currentTd = $(this);

                if (currentTd.hasClass('highlight')) {
                    currentTd.css({"background-color": currentTd.attr('old-background-color')})
                    currentTd.removeAttr('old-background-color')
                } else {
                    currentTd.attr('old-background-color', currentTd.css("background-color"))
                    currentTd.css({"background-color": "rgba(20, 255, 20, .5)"})
                }

                var highlightIndex = $(this).parent('tr').find('td').index(currentTd)
                $resultTable.find('tr').each(function () {
                    $(this).find('td').eq(highlightIndex).toggleClass('highlight')
                })
            })
        })

        showHideColumns(resultId)
    }

    function HideHighlightedColumns($resultTable) {
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').each(function (index, td) {
                if ($(td).hasClass('highlight')) {
                    $resultTable.find('tr').each(function () {
                        $(this).find('td').eq(index).addClass('hide').removeClass('highlight')
                    })
                }
            })
        })
    }

    function OnlyShowHighlightedColumns($resultTable) {
        $resultTable.find('thead tr').each(function () {
            $(this).find('td').each(function (index, td) {
                if (!$(td).hasClass('highlight')) {
                    $resultTable.find('tr').each(function () {
                        $(this).find('td').eq(index).addClass('hide')
                    })
                } else {
                    $resultTable.find('tr').each(function () {
                        $(this).find('td').eq(index).removeClass('highlight')
                    })
                }
            })
        })
    }

    function CopyHighlightedColumnsAsTsv($resultTable) {
        var csv = []
        $resultTable.find('tr:visible').each(function (index, tr) {
            var csvLine = []
            $(tr).find('td').each(function (index, td) {
                if (index == 0) return

                var $td = $(td)
                if ($td.hasClass('highlight')) {
                    csvLine.push($.csvString($td.text()))
                }
            })
            csv.push(csvLine.join('\t'))
        })
        $.copyTextToClipboard(csv.join('\n'))
    }

    function CopyAsTsv($resultTable) {
        var csv = []
        $resultTable.find('tr:visible').each(function (index, tr) {
            var csvLine = []
            $(tr).find('td').each(function (index, td) {
                if (index == 0) return

                var $td = $(td)
                if (!$td.hasClass('hide')) {
                    csvLine.push($.csvString($td.text()))
                }
            })
            csv.push(csvLine.join('\t'))
        })
        $.copyTextToClipboard(csv.join('\n'))
    }

    $.findFirstHighlightedColumnIndex = function ($resultTable) {
        var compareColumnIndex = -1
        $resultTable.find('thead tr').eq(0).find('td').each(function (index, td) {
            if ($(td).hasClass('highlight')) {
                compareColumnIndex = index
                return false // break
            }
        })

        return compareColumnIndex
    }


    $.findHighlightedColumnIndexes = function ($resultTable) {
        var highlightedColumnIndexes = []
        $resultTable.find('thead tr').eq(0).find('td').each(function (index, td) {
            if ($(td).hasClass('highlight')) {
                highlightedColumnIndexes.push(index)
            }
        })

        return highlightedColumnIndexes
    }

    var FilterAndOrderHighlightedColumn = function ($resultTable) {
        var lines = $.getEditorText().split('\n')
        var filteredLines = []
        var filteredValues = {}

        var dupliates = []
        for (var i = 0; i < lines.length; ++i) {
            var lineValue = $.trim(lines[i])
            if (lineValue.length === 0) continue;

            if (filteredValues[lineValue]) {
                dupliates.push(lineValue)
            } else {
                filteredLines.push(lineValue)
                filteredValues[lineValue] = filteredLines.length
            }
        }

        if (dupliates.length > 0) {
            $.appendSqlToSqlEditor("\n\nDuplicated:\n" + dupliates.join('\n'), true, true)
            $.alertMe(dupliates.length + " duplicated items found!")
        }

        var compareColumnIndex = $.findFirstHighlightedColumnIndex($resultTable)
        if (compareColumnIndex < 0) {
            $.alertMe("No column highlighted!")
            return
        }

        if (filteredLines.length == 0) {
            $.alertMe("No Values Specified!")
            return
        }

        $.filterSortTableByValues($resultTable, compareColumnIndex, filteredValues)
    }

    var showHideColumns = function (resultId) {
        var queryResultId = '#queryResult' + resultId
        const dapsLogId = '#dapsLog' + resultId
        const dapsOptionJSON = '#dapsOptionJSON' + resultId

        $.contextMenu({
            zIndex: 10,
            selector: '#resultId' + resultId,
            trigger: 'left',
            callback: function (key, options) {
                var $resultTable = $(queryResultId)

                if (key === 'HideHighlightedColumns') {
                    HideHighlightedColumns($resultTable)
                } else if (key === 'OnlyShowHighlightedColumns') {
                    OnlyShowHighlightedColumns($resultTable)
                } else if (key === 'ShowAllColumns') {
                    $resultTable.find('td').removeClass('hide').removeClass('highlight')
                } else if (key === 'CopyHighlightedColumnsAsTsv') {
                    CopyHighlightedColumnsAsTsv($resultTable)
                } else if (key === 'CopyAsTsv') {
                    CopyAsTsv($resultTable)
                } else if (key === 'MakeDraggable') {
                    // http://www.danvk.org/wp/dragtable/index.html
                    dragtable.makeDraggable($resultTable[0])
                } else if (key === 'FilterAndOrderHighlightedColumn') {
                    FilterAndOrderHighlightedColumn($resultTable)
                } else if (key === 'DapsRaw') {
                } else if (key === 'ShowDapsLog') {
                    const content = $(dapsLogId).text()
                    console.log(content)
                    $.confirmMe("请在 Console 中查看 DAPS 执行日志", "是否同时需要下载？", function () {
                        // 获取当前时间并格式化为yyyyMMddHHmmss
                        const now = new Date();
                        const pad = n => n.toString().padStart(2, '0');
                        const yyyy = now.getFullYear();
                        const MM = pad(now.getMonth() + 1);
                        const dd = pad(now.getDate());
                        const HH = pad(now.getHours());
                        const mi = pad(now.getMinutes());
                        const SS = pad(now.getSeconds());
                        const timeStr = `${yyyy}${MM}${dd}${HH}${mi}${SS}`;
                        const fileName = dapsLogId.substring(1) + "_" + timeStr + ".log";
                        // 1. 创建Blob对象
                        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
                        // 2. 创建下载URL
                        const url = URL.createObjectURL(blob);
                        // 3. 创建临时链接并触发下载
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        // 4. 清理资源
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    })
                }
            },
            items: {
                HideHighlightedColumns: {name: "Hide Highlighted Columns", icon: "columns"},
                OnlyShowHighlightedColumns: {name: "Only Show Highlighted Columns", icon: "columns"},
                ShowAllColumns: {name: "Show All Columns", icon: "columns"},
                CopyHighlightedColumnsAsTsv: {name: "Copy Highlighted Columns As TSV", icon: "columns"},
                CopyAsTsv: {name: "Copy As TSV", icon: "columns"},
                MakeDraggable: {name: "Make Draggable", icon: "columns"},
                FilterAndOrderHighlightedColumn: {
                    name: "Filter And Order Highlighted Column By Specified Values",
                    icon: "columns"
                },
                ShowDapsLog: {name: "查看 DAPS 执行日志", icon: "columns"},
                // <input type="checkbox">
                DapsRaw: {
                    name: "原始驱动执行SQL(不经过DAPS)",
                    type: 'checkbox',
                    selected: false
                },
            },
            // contextMenu 帮助: https://swisnl.github.io/jQuery-contextMenu/demo/input.html
            events: {
                show: function(opt) {
                    // this is the trigger element
                    var $this = this;
                    // import states from data store
                    $.contextMenu.setInputValues(opt, $this.data());
                    // this basically fills the input commands from an object
                    // like {name: "foo", yesno: true, radio: "3", &hellip;}
                },
                hide: function(opt) {
                    // this is the trigger element
                    var $this = this;
                    // export states to data store
                    var data = $.contextMenu.getInputValues(opt, $this.data());
                    $(dapsOptionJSON).text(JSON.stringify({
                        DapsRaw: data.DapsRaw
                    }))
                    // this basically dumps the input commands' values to an object
                    // like {name: "foo", yesno: true, radio: "3", &hellip;}
                }
            }
        })
    }
})()