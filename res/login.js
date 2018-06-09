(function () {
    function bindLoginButon() {
        $('.loginButton').click(function () {
            window.open(contextPath + "/login")
        })
    }

    bindLoginButon()
})()