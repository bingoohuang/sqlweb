package main

import (
	"bytes"
	"errors"
	"github.com/tdewolff/minify"
	"github.com/tdewolff/minify/css"
	"github.com/tdewolff/minify/html"
	"github.com/tdewolff/minify/js"
	"log"
	"net/http"
	"strings"
)

func serveHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != contextPath+"/" {
		http.Error(w, "Not found", 404)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	indexHtml := string(MustAsset("res/index.html"))
	indexHtml = strings.Replace(indexHtml, "<LOGIN/>", loginHtml(w, r), 1)

	html := minifyHtml(indexHtml, devMode)

	css, js := minifyCssJs(mergeCss(), mergeScripts(), devMode)
	html = strings.Replace(html, "/*.CSS*/", css, 1)
	html = strings.Replace(html, "/*.SCRIPT*/", js, 1)

	w.Write([]byte(html))
}

func minifyHtml(htmlStr string, devMode bool) string {
	if devMode {
		return htmlStr
	}

	mini := minify.New()
	mini.AddFunc("text/html", html.Minify)
	minified, _ := mini.String("text/html", htmlStr)
	return minified
}

func minifyCssJs(mergedCss, mergedJs string, devMode bool) (string, string) {
	if devMode {
		return mergedCss, mergedJs
	}

	mini := minify.New()
	mini.AddFunc("text/css", css.Minify)
	mini.AddFunc("text/javascript", js.Minify)

	minifiedCss, _ := mini.String("text/css", mergedCss)
	minifiedJs, _ := mini.String("text/javascript", mergedJs)

	return minifiedCss, minifiedJs
}

func mergeCss() string {
	return mergeStatic("codemirror-5.29.0.min.css", "index.css")
}

func mergeScripts() string {
	return mergeStatic("jquery-3.2.1.min.js", "common.js",
		"codemirror-5.29.0.min.js", "sql-5.29.0.min.js", "toml-5.29.0.min.js", "toml.js",
		"linksConfig.js",
		"sql-formatter-2.0.0.min.js",
		"sqlEditor.js", "searchTenants.js", "tables.js", "rowFilter.js", "createSql.js",
		"transposeRows.js",
		"index.js")
}

func mergeStatic(statics ...string) string {
	var scripts bytes.Buffer
	for _, static := range statics {
		scripts.Write(MustAsset("res/" + static))
		scripts.Write([]byte(";"))
	}

	return scripts.String()
}

func loginHtml(w http.ResponseWriter, r *http.Request) string {
	if !writeAuthRequired {
		return ""
	}

	loginCookie := readLoginCookie(r)
	if loginCookie == nil || loginCookie.Name == "" {
		loginCookie, _ = tryLogin(loginCookie, w, r)
	}

	if loginCookie == nil {
		return `<button class="loginButton">Login</button>`
	}

	return `<img class="loginAvatar" src="` + loginCookie.Avatar +
		`"/><span class="loginName">` + loginCookie.Name + `</span>`
}

func tryLogin(loginCookie *CookieValue, w http.ResponseWriter, r *http.Request) (*CookieValue, error) {
	code := r.FormValue("code")
	state := r.FormValue("state")
	log.Println("code:", code, ",state:", state)
	if loginCookie != nil && code != "" && state == loginCookie.CsrfToken {
		accessToken, err := getAccessToken(corpId, corpSecret)
		if err != nil {
			return nil, err
		}
		userId, err := getLoginUserId(accessToken, code)
		if err != nil {
			return nil, err
		}
		userInfo, err := getUserInfo(accessToken, userId)
		if err != nil {
			return nil, err
		}
		cookie := writeUserInfoCookie(w, userInfo)
		return cookie, nil
	}

	return nil, errors.New("no login")
}
