package main

import (
	"github.com/bingoohuang/go-utils"
	"net/http"
	"strconv"
	"strings"
)

func serveHome(w http.ResponseWriter, r *http.Request) {
	go_utils.HeadContentTypeHtml(w)
	cookieValue := r.Context().Value("CookieValue")
	loginedHtml := ""
	if cookieValue != nil {
		cookie := cookieValue.(*go_utils.CookieValueImpl)
		loginedHtml = `<span id="loginSpan"><img class="loginAvatar" src="` + cookie.Avatar +
			`"/><span class="loginName">` + cookie.Name + `</span></span>`
	}

	indexHtml := string(MustAsset("res/index.html"))
	indexHtml = strings.Replace(indexHtml, "<LOGIN/>", loginedHtml, 1)

	html := go_utils.MinifyHtml(indexHtml, devMode)

	mergeCss := go_utils.MergeCss(MustAsset, go_utils.FilterAssetNames(AssetNames(), ".css"))
	css := go_utils.MinifyCss(mergeCss, devMode)
	mergeScripts := go_utils.MergeJs(MustAsset, go_utils.FilterAssetNames(AssetNames(), ".js"))
	js := go_utils.MinifyJs(mergeScripts, devMode)
	html = strings.Replace(html, "/*.CSS*/", css, 1)
	html = strings.Replace(html, "/*.SCRIPT*/", js, 1)
	html = strings.Replace(html, "${contextPath}", contextPath, -1)
	html = strings.Replace(html, "${multiTenants}", strconv.FormatBool(multiTenants), -1)
	html = strings.Replace(html, "${defaultTenant}", defaultTenant, -1)

	w.Write([]byte(html))
}
