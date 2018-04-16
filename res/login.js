(function () {
    $('.loginButton').click(function () {
        $.ajax({
            type: 'POST',
            url: contextPath + "/login",
            success: function (content, textStatus, request) {
                window.location = content.RedirectUrl
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })
})()