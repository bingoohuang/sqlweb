(function () {
    // refer : https://codemirror.net/mode/toml/index.html
    var tomlEditor = CodeMirror.fromTextArea(document.getElementById("tomlEditor"), {
        mode: 'text/x-toml',
        lineNumbers: true
    })
})()