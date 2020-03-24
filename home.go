package sqlweb

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/bingoohuang/gou/htt"
)

func loginedUserName(r *http.Request) string {
	cookieValue := r.Context().Value("CookieValue")
	if cookieValue == nil {
		return ""
	}

	cookie := cookieValue.(*htt.CookieValueImpl)
	return cookie.Name
}

func ServeHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	cookieValue := r.Context().Value("CookieValue")
	loginedHtml := ""
	if cookieValue != nil {
		cookie := cookieValue.(*htt.CookieValueImpl)
		loginedHtml = `<span id="loginSpan"><img class="loginAvatar" src="` + cookie.Avatar +
			`"/><span class="loginName">` + cookie.Name + `</span></span>`
	}

	indexHtml := string(MustAsset("index.html"))
	indexHtml = strings.Replace(indexHtml, "<LOGIN/>", loginedHtml, 1)

	html := htt.MinifyHTML(indexHtml, AppConf.DevMode)

	mergeCss := htt.MergeCSS(MustAsset, FilterAssetNames(AssetNames, ".css"))
	css := htt.MinifyCSS(mergeCss, AppConf.DevMode)
	mergeScripts := htt.MergeJs(MustAsset, FilterAssetNames(AssetNames, ".js"))
	js := htt.MinifyJs(mergeScripts, AppConf.DevMode)
	html = strings.Replace(html, "/*.CSS*/", css, 1)
	html = strings.Replace(html, "/*.SCRIPT*/", js, 1)
	html = strings.Replace(html, "${contextPath}", AppConf.ContextPath, -1)
	html = strings.Replace(html, "${multiTenants}", strconv.FormatBool(AppConf.MultiTenants), -1)
	html = strings.Replace(html, "${defaultTenant}", AppConf.DefaultTenant, -1)

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
