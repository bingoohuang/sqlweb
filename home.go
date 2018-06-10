package main

import (
	"github.com/bingoohuang/go-utils"
	"net/http"
	"strconv"
	"strings"
)

func serveHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	cookie := r.Context().Value("CookieValue").(*go_utils.CookieValueImpl)
	loginedHtml := `<span id="loginSpan"><img class="loginAvatar" src="` + cookie.Avatar +
		`"/><span class="loginName">` + cookie.Name + `</span></span>`

	indexHtml := string(MustAsset("res/index.html"))
	indexHtml = strings.Replace(indexHtml, "<LOGIN/>", loginedHtml, 1)

	html := go_utils.MinifyHtml(indexHtml, *devMode)

	css := go_utils.MinifyCss(mergeCss(), *devMode)
	js := go_utils.MinifyJs(mergeScripts(), *devMode)
	html = strings.Replace(html, "/*.CSS*/", css, 1)
	html = strings.Replace(html, "/*.SCRIPT*/", js, 1)
	html = strings.Replace(html, "${contextPath}", contextPath, -1)
	html = strings.Replace(html, "${multiTenants}", strconv.FormatBool(*multiTenants), -1)

	w.Write([]byte(html))
}

func mergeCss() string {
	return go_utils.MergeCss(MustAsset, "index.css", "jquery.contextMenu.css")
}

func mergeScripts() string {
	return go_utils.MergeJs(MustAsset,
		"common.js", "linksConfig.js", "columns.js", "dragtable.js", "markRowsOrCells.js", "exportdb.js",
		"searchTenants.js", "tables.js", "rowFilter.js", "createSql.js", "showCreateTable.js",
		"transposeRows.js", "login.js", "sqlAjax.js", "checkboxEditable.js", "saveUpdates.js",
		"resultTable.js", "tableCreate.js", "showColumn.js", "multipleTenantsQueryAjax.js",
		"contextMenu.js", "fastEntries.js",
		"index.js", "sqlEditor.js", "utils.js", "jquery.loading.js", "template.js", "sqlTemplates.js")
}
