(function () {
    function bindLoginButon() {
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
    }

    bindLoginButon()

    $('.loginName a').click(function () {
        $.ajax({
            type: 'POST',
            url: contextPath + "/logout",
            success: function (content, textStatus, request) {
                $('#loginSpan').replaceWith('<button class="loginButton">Login</button>')
                bindLoginButon()
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.responseText + "\nStatus: " + textStatus + "\nError: " + errorThrown)
            }
        })
    })
})()