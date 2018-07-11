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

	html := go_utils.MinifyHtml(indexHtml, appConfig.DevMode)

	mergeCss := go_utils.MergeCss(MustAsset, go_utils.FilterAssetNames(AssetNames(), ".css"))
	css := go_utils.MinifyCss(mergeCss, appConfig.DevMode)
	mergeScripts := go_utils.MergeJs(MustAsset, go_utils.FilterAssetNames(AssetNames(), ".js"))
	js := go_utils.MinifyJs(mergeScripts, appConfig.DevMode)
	html = strings.Replace(html, "/*.CSS*/", css, 1)
	html = strings.Replace(html, "/*.SCRIPT*/", js, 1)
	html = strings.Replace(html, "${contextPath}", appConfig.ContextPath, -1)
	html = strings.Replace(html, "${multiTenants}", strconv.FormatBool(appConfig.MultiTenants), -1)
	html = strings.Replace(html, "${defaultTenant}", appConfig.DefaultTenant, -1)

	w.Write([]byte(html))
}
