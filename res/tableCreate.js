(function () {
    function copyRows($checkboxes) {
        $checkboxes.each(function (index, checkbox) {
            var $tr = $(checkbox).parents('tr')
            $tr.find(':checked').prop("checked", false)
            var $clone = $tr.clone().addClass('clonedRow')
            $clone.insertAfter($tr)
            $clone.find('input[type=checkbox]').click($.toggleRowEditable).click()
        })
    }

    function attachDeleteRowsEvent(queryResultId) {
        var cssChoser = '#queryResult' + queryResultId + ' :checked'
        $('#deleteRows' + queryResultId).click(function () {
            $(cssChoser).parents('tr').addClass('deletedRow')
        })
    }

    function attachCopyRowsEvent(thisQueryResult) {
        $('#copyRow' + thisQueryResult).click(function () {
            var checkboxes = $('#queryResult' + thisQueryResult + ' :checked')
            if (checkboxes.length == 0) {
                alert('please specify which row to copy')
            } else {
                copyRows($(checkboxes))
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

        var newResultId = ++queryResultId
        var contextMenuHolder = {}
        var table = $.createResultTableHtml(result, sql, rowUpdateReady, newResultId, contextMenuHolder, classifier, tid, tname)
        if (oldResultId && oldResultId > 0) {
            $('#executionResultDiv' + oldResultId).replaceWith(table)
        } else {
            $(table).prependTo($('.result'))
        }

        $('#queryResult' + newResultId + ' tbody tr:odd').addClass('rowOdd').attr('rowOdd', 'true')
        $.attachSearchTableEvent(newResultId, 1)
        $.attachExpandRowsEvent(newResultId)
        $.attachOpsResultDivEvent(newResultId)
        $.createLinkToTableContextMenu(contextMenuHolder, classifier, tid, tname)
        $.createTableToolsContextMenu(classifier, tid, tname, result, newResultId)

        if (rowUpdateReady) {
            $.attachEditableEvent(newResultId)
            attachCopyRowsEvent(newResultId)
            attachDeleteRowsEvent(newResultId)
            $.attachRowTransposesEvent(newResultId)
            $.attachSaveUpdatesEvent(result, newResultId)
        }
    }
})()
