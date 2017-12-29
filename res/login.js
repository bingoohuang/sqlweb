(function () {
    $('.loginButton').click(function () {
        $.ajax({
            type: 'POST',
            url: pathname + "/login",
            data: {tid: activeMerchantId, sql: 'show tables'},
            success: function (content, textStatus, request) {
                window.location = content.RedirectUrl
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })
})()