(function () {
    function copyRows($checkedRows) {
        $checkedRows.each(function (index, tr) {
            var $tr = $(tr)
            var $clone = $tr.clone().addClass('clonedRow')
            $clone.insertAfter($tr)
        })
    }

    function attachDeleteRowsEvent(resultId) {
        $('#deleteRows' + resultId).click(function () {
            $.chosenRows(resultId).toggleClass('deletedRow')
        })
    }

    function attachCopyRowsEvent(resultId) {
        var rid = resultId
        $('#copyRow' + rid).click(function () {
            var $checkedRows = $.chosenRows(rid)
            if ($checkedRows.length == 0) {
                $.alertMe('please specify which row to copy')
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
        var rid = resultId
        $('#screenShot' + rid).click(function () {
            $.screenShot(rid)
        })

        var reExecuteSql = '#reExecuteSql' + resultId;
        $(reExecuteSql).click(function () {
            var $this = $(this);
            var classifier = $this.attr('classifier')
            var tid = $this.attr('tid')
            var tcode = $this.attr('tcode')
            var tname = $this.attr('tname')
            var sql = $(divId).find('.sqlTd').text()
            $.executeQueryAjax(classifier, tid, tcode, tname, sql, resultId)
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
                $.alertMe("please input the sql!")
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

    $.attachExpandRowsEvent = function (resultId, totalRows) {
        var rid = resultId
        $('#expandRows' + rid).click(function () {
            $('#collapseDiv' + rid).toggleClass('collapseDiv')
        })
    }

    $.tableCreate = function (result, sql, oldResultId, classifier, tid, tcode, tname) {
        if (!result.Headers) {
            result.Headers = []
        }
        var showFullColumns = sql.startsWith("show full columns from ")
        if (showFullColumns) {
            result.TableName = sql.substring("show full columns from ".length)
        }
        var rowUpdateReady = result.TableName && result.TableName != ""
        var resultId = oldResultId !== null && oldResultId >= 0 ? oldResultId : ++queryResultId
        var contextMenuHolder = {}
        var totalRows = result.Rows && result.Rows.length > 0 ? result.Rows.length : 0
        var table = $.createResultTableHtml(result, sql, rowUpdateReady, resultId, contextMenuHolder, classifier, tid, tcode, tname)

        $.replaceOrPrependResult(resultId, oldResultId, table)

        $('#queryResult' + resultId + ' tbody tr:odd').addClass('rowOdd').attr('rowOdd', 'true')
        $.attachSearchTableEvent(resultId)
        $.attachExpandRowsEvent(resultId, totalRows)
        $.attachOpsResultDivEvent(resultId)
        $.createLinkToTableContextMenu(contextMenuHolder, classifier, tid, tcode, tname)
        $.createTableToolsContextMenu(classifier, tid, tcode, tname, result, resultId)
        $.attachHighlightColumnEvent(resultId)
        $.attachRowTransposesEvent(resultId)
        $.attachMarkRowsOrCellsEvent(resultId)

        if (rowUpdateReady) {
            $.attachEditableEvent(resultId)
            attachCopyRowsEvent(resultId)
            attachDeleteRowsEvent(resultId)
            if (showFullColumns) {
                $.attachDdlEvent(tid, result, resultId)
            } else {
                $.attachSaveUpdatesEvent(tid, result, resultId)
            }
        }
    }
})()
