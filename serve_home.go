package main

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/tdewolff/minify"
	"github.com/tdewolff/minify/css"
	"github.com/tdewolff/minify/html"
	"github.com/tdewolff/minify/js"
	"log"
	"net/http"
	"strings"
)

func serveHome(w http.ResponseWriter, r *http.Request) {
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
	html = strings.Replace(html, "${ContextPath}", contextPath, -1)

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

	minifiedCss, err := mini.String("text/css", mergedCss)
	if err != nil {
		fmt.Println("mini css:", err.Error())
	}
	minifiedJs, err := mini.String("text/javascript", mergedJs)
	if err != nil {
		fmt.Println("mini js:", err.Error())
	}

	return minifiedCss, minifiedJs
}

func mergeCss() string {
	return mergeStatic("\n",
		"codemirror-5.33.0.min.css", "index.css", "jquery.contextMenu.css")
}

func mergeScripts() string {
	return mergeStatic(";",
		"jquery-3.2.1.min.js", "common.js",
		"codemirror-5.33.0.min.js", "sql-5.33.0.min.js", "toml-5.33.0.min.js", "placeholder-5.33.0.js",
		"linksConfig.js",
		"sql-formatter-2.0.0.min.js",
		"searchTenants.js", "tables.js", "rowFilter.js", "createSql.js", "showCreateTable.js",
		"transposeRows.js", "login.js", "sqlAjax.js", "checkboxEditable.js", "saveUpdates.js",
		"resultTable.js", "tableCreate.js", "showColumn.js", "multipleTenantsQueryAjax.js",
		"contextMenu.js", "jquery.contextMenu.js", "jquery.ui.position.js", "fastEntries.js",
		"SqlsVersion.js",
		"index.js", "sqlEditor.js", "utils.js", "jquery.loading.js")
}

func mergeStatic(seperate string, statics ...string) string {
	var scripts bytes.Buffer
	for _, static := range statics {
		scripts.Write(MustAsset("res/" + static))
		scripts.Write([]byte(seperate))
	}

	return scripts.String()
}

func loginHtml(w http.ResponseWriter, r *http.Request) string {
	if !writeAuthRequired {
		return `<button id="SqlsVersion">Sqls Version</button>`
	}

	loginCookie := readLoginCookie(r)
	if loginCookie == nil || loginCookie.Name == "" {
		loginCookie, _ = tryLogin(loginCookie, w, r)
	}

	if loginCookie == nil {
		return `<button class="loginButton">Login</button>`
	}

	return `<button id="SqlsVersion">Sqls Version</button>` +
		`<img class="loginAvatar" src="` + loginCookie.Avatar +
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
