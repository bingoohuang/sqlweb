package sqlweb

import (
	"net/http"
	"strings"

	"github.com/bingoohuang/gou/htt"
)

func loginedUserName(r *http.Request) string {
	cookieValue := r.Context().Value(LoginUserKey)
	if cookieValue == nil {
		return ""
	}

	user := cookieValue.(*LoginUser)
	return user.Name
}

type ContextKey int

const (
	LoginUserKey ContextKey = iota
)

// LoginUser ...
type LoginUser struct {
	Name            string
	DSNGroups       []int
	DefaultDB       int
	Limit2ConfigDSN bool
}

func ServeHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	cookieValue := r.Context().Value(LoginUserKey)
	var loginUser *LoginUser
	loginedHtml := ""
	if cookieValue != nil {
		loginUser = cookieValue.(*LoginUser)
		loginedHtml = `<span id="loginSpan"><span class="loginName">` + loginUser.Name + `</span></span>`
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
	html = strings.Replace(html, "${multiTenants}", "true", -1)
	html = strings.Replace(html, "${defaultTenant}", AppConf.DefaultDB, -1)

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
