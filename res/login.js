(function () {
    function bindLoginButon() {
        $('.loginButton').click(function () {
            window.open(contextPath + "/login")
        })
    }

    bindLoginButon()

    $.bindLogoutButon = function() {
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
    }

    $.bindLogoutButon()
})()