package main

import (
	"bytes"
	"errors"
	"github.com/bingoohuang/go-utils"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func serveHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	indexHtml := string(MustAsset("res/index.html"))
	indexHtml = strings.Replace(indexHtml, "<LOGIN/>", loginHtml(w, r), 1)

	html := go_utils.MinifyHtml(indexHtml, devMode)

	css := go_utils.MinifyCss(mergeCss(), devMode)
	js := go_utils.MinifyJs(mergeScripts(), devMode)
	html = strings.Replace(html, "/*.CSS*/", css, 1)
	html = strings.Replace(html, "/*.SCRIPT*/", js, 1)
	html = strings.Replace(html, "${contextPath}", contextPath, -1)
	html = strings.Replace(html, "${multiTenants}", strconv.FormatBool(multiTenants), -1)

	w.Write([]byte(html))
}

func mergeCss() string {
	return mergeStatic("\n", "index.css", "jquery.contextMenu.css")
}

func mergeScripts() string {
	return mergeStatic(";",
		"common.js", "linksConfig.js", "columns.js", "dragtable.js", "markRowsOrCells.js", "exportdb.js",
		"searchTenants.js", "tables.js", "rowFilter.js", "createSql.js", "showCreateTable.js",
		"transposeRows.js", "login.js", "sqlAjax.js", "checkboxEditable.js", "saveUpdates.js",
		"resultTable.js", "tableCreate.js", "showColumn.js", "multipleTenantsQueryAjax.js",
		"contextMenu.js", "fastEntries.js",
		"index.js", "sqlEditor.js", "utils.js", "jquery.loading.js", "template.js", "sqlTemplates.js")
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
		return ""
	}

	loginCookie := &CookieValue{}
	err := go_utils.ReadCookie(r, encryptKey, cookieName, loginCookie)
	if err != nil || loginCookie.Name == "" {
		err = tryLogin(loginCookie, w, r)
	}

	if err != nil {
		return `<button class="loginButton">Login</button>`
	}

	return `<span id="loginSpan"><img class="loginAvatar" src="` + loginCookie.Avatar +
		`"/><span class="loginName">` + loginCookie.Name + `<a title="Exit Login" href="javascript:void(0)">Exit<a/></span></span>`
}

type CookieValue struct {
	UserId    string
	Name      string
	Avatar    string
	CsrfToken string
	Expired   time.Time
}

func (t *CookieValue) ExpiredTime() time.Time {
	return t.Expired
}

func tryLogin(loginCookie *CookieValue, w http.ResponseWriter, r *http.Request) error {
	code := r.FormValue("code")
	state := r.FormValue("state")
	log.Println("code:", code, ",state:", state)
	if loginCookie != nil && code != "" && state == loginCookie.CsrfToken {
		accessToken, err := go_utils.GetAccessToken(corpId, corpSecret)
		if err != nil {
			return err
		}
		userId, err := go_utils.GetLoginUserId(accessToken, code)
		if err != nil {
			return err
		}
		userInfo, err := go_utils.GetUserInfo(accessToken, userId)
		if err != nil {
			return err
		}

		loginCookie.UserId = userInfo.UserId
		loginCookie.Name = userInfo.Name
		loginCookie.Avatar = userInfo.Avatar
		loginCookie.CsrfToken = ""
		loginCookie.Expired = time.Now().Add(time.Duration(24) * time.Hour)

		go_utils.WriteCookie(w, encryptKey, cookieName, loginCookie)
		return nil
	}

	return errors.New("no login")
}
