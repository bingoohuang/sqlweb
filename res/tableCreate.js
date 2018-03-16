(function () {
    function copyRows($checkedRows) {
        $checkedRows.each(function (index, tr) {
            var $tr = $(tr)
            $tr.find(':checked').prop("checked", false)
            var $clone = $tr.clone().addClass('clonedRow')
            $clone.insertAfter($tr)
            $clone.find('input[type=checkbox]').click(function () {
                $.toggleRowEditable($(this))
            }).click()
        })
    }

    function attachDeleteRowsEvent(resultId) {
        $('#deleteRows' + resultId).click(function () {
            $.chosenRows(resultId).addClass('deletedRow')
        })
    }

    function attachCopyRowsEvent(resultId) {
        $('#copyRow' + resultId).click(function () {
            var $checkedRows = $.chosenRows(resultId)
            if ($checkedRows.length == 0) {
                alert('please specify which row to copy')
            } else {
                copyRows($checkedRows)
            }
        })
    }

    function createTenantMap(tenants) {
        var tenantsMap = {}
        for (var i = 0; i < tenants.length; ++i) {
            var tenant = tenants[i]
            tenantsMap[tenant.merchantId] = tenant
        }
        return tenantsMap
    }

    function createTenantIdGroup(tenants, groupSize) {
        var tenantIdsGroup = []
        var group = []
        for (var i = 0; i < tenants.length; ++i) {
            group.push(tenants[i].merchantId)

            if (group.length == groupSize) {
                tenantIdsGroup.push(group)
                group = []
            }
        }

        if (group.length > 0) {
            tenantIdsGroup.push(group)
        }

        return tenantIdsGroup;
    }

    $.attachOpsResultDivEvent = function (resultId) {
        var divId = '#executionResultDiv' + resultId
        $('#closeResult' + resultId).click(function () {
            $(divId).remove()
        })

        var reExecuteSql = '#reExecuteSql' + resultId;
        $(reExecuteSql).click(function () {
            var $this = $(this);
            var classifier = $this.attr('classifier')
            var tid = $this.attr('tid')
            var tname = $this.attr('tname')
            var sql = $(divId).find('.sqlTd').text()
            $.executeQueryAjax(classifier, tid, tname, sql, resultId)
        })

        $('#sqlDiv' + resultId).keydown(function (event) {
            if ((event.metaKey || event.ctrlKey) && event.keyCode == 13) {
                $(reExecuteSql).click()
            }
        })

        var multipleTenantsExecutable = $('#multipleTenantsExecutable' + resultId);
        multipleTenantsExecutable.find('.opsSpan').click(function () {
            var sql = $.trim($.getEditorSql())
            if (sql === "") {
                alert("please input the sql!")
                return
            }

            var $this = $(this)

            var merchantIdIndex = parseInt($this.attr('merchantIdIndex'))
            var merchantNameIndex = parseInt($this.attr('merchantNameIndex'))
            var merchantCodeIndex = parseInt($this.attr('merchantCodeIndex'))
            var tenants = $.findTenants(resultId, merchantIdIndex, merchantNameIndex, merchantCodeIndex)

            var batchSizeInput = multipleTenantsExecutable.find('.batchSize');
            var batchSize = parseInt(batchSizeInput.val() || batchSizeInput.prop('placeholder'))
            var tenantIdsGroup = createTenantIdGroup(tenants, batchSize)

            if (tenantIdsGroup.length > 0) {
                var tenantsMap = createTenantMap(tenants)
                var batchConfirm = multipleTenantsExecutable.find('.confirm').prop('checked')
                $.multipleTenantsQueryAjax(sql, tenantsMap, ++queryResultId, 0, tenantIdsGroup, 0, 0, Date.now(), batchConfirm)
            }
        })
    }

    $.attachExpandRowsEvent = function (resultId) {
        var buttonId = '#expandRows' + resultId
        var collapseDiv = '#collapseDiv' + resultId

        $(buttonId).click(function () {
            if ($(this).text() == 'Expand Rows') {
                $(collapseDiv).removeClass('collapseDiv')
                $(this).text('Collapse Rows')
            } else {
                $(collapseDiv).addClass('collapseDiv')
                $(this).text('Expand Rows')
            }
        }).toggle($(collapseDiv).height() >= 300)
    }

    $.tableCreate = function (result, sql, oldResultId, classifier, tid, tname) {
        if (!result.Headers) {
            result.Headers = []
        }
        var rowUpdateReady = result.TableName && result.TableName != ""
        var resultId = oldResultId !== null && oldResultId >= 0 ? oldResultId : ++queryResultId
        var contextMenuHolder = {}
        var table = $.createResultTableHtml(result, sql, rowUpdateReady, resultId, contextMenuHolder, classifier, tid, tname)
        if (resultId === oldResultId) {
            $('#executionResultDiv' + oldResultId).replaceWith(table)
        } else {
            $(table).prependTo($('.result'))
        }
        $('#queryResult' + resultId + ' tbody tr:odd').addClass('rowOdd').attr('rowOdd', 'true')
        $.attachSearchTableEvent(resultId, 1)
        $.attachExpandRowsEvent(resultId)
        $.attachOpsResultDivEvent(resultId)
        $.createLinkToTableContextMenu(contextMenuHolder, classifier, tid, tname)
        $.createTableToolsContextMenu(classifier, tid, tname, result, resultId)

        if (rowUpdateReady) {
            $.attachEditableEvent(resultId)
            attachCopyRowsEvent(resultId)
            attachDeleteRowsEvent(resultId)
            $.attachRowTransposesEvent(resultId)
            $.attachSaveUpdatesEvent(tid, result, resultId)
        }
    }
})()
