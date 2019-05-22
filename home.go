package main

import (
	"github.com/bingoohuang/gou"
	"net/http"
	"strconv"
	"strings"
)

func loginedUserName(r *http.Request) string {
	cookieValue := r.Context().Value("CookieValue")
	if cookieValue == nil {
		return ""
	}

	cookie := cookieValue.(*gou.CookieValueImpl)
	return cookie.Name
}

func serveHome(w http.ResponseWriter, r *http.Request) {
	gou.HeadContentTypeHtml(w)
	cookieValue := r.Context().Value("CookieValue")
	loginedHtml := ""
	if cookieValue != nil {
		cookie := cookieValue.(*gou.CookieValueImpl)
		loginedHtml = `<span id="loginSpan"><img class="loginAvatar" src="` + cookie.Avatar +
			`"/><span class="loginName">` + cookie.Name + `</span></span>`
	}

	indexHtml := string(MustAsset("index.html"))
	indexHtml = strings.Replace(indexHtml, "<LOGIN/>", loginedHtml, 1)

	html := gou.MinifyHtml(indexHtml, appConfig.DevMode)

	mergeCss := gou.MergeCss(MustAsset, FilterAssetNames(AssetNames, ".css"))
	css := gou.MinifyCss(mergeCss, appConfig.DevMode)
	mergeScripts := gou.MergeJs(MustAsset, FilterAssetNames(AssetNames, ".js"))
	js := gou.MinifyJs(mergeScripts, appConfig.DevMode)
	html = strings.Replace(html, "/*.CSS*/", css, 1)
	html = strings.Replace(html, "/*.SCRIPT*/", js, 1)
	html = strings.Replace(html, "${contextPath}", appConfig.ContextPath, -1)
	html = strings.Replace(html, "${multiTenants}", strconv.FormatBool(appConfig.MultiTenants), -1)
	html = strings.Replace(html, "${defaultTenant}", appConfig.DefaultTenant, -1)

	w.Write([]byte(html))
}

func FilterAssetNames(assetNames []string, suffix string) []string {
	filtered := make([]string, 0)
	for _, assetName := range assetNames {
		if !strings.HasPrefix(assetName, "static/") && strings.HasSuffix(assetName, suffix) {
			filtered = append(filtered, assetName)
		}
	}

	return filtered
}
