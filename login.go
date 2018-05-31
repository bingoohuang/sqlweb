package main

import (
	"github.com/bingoohuang/go-utils"
	"log"
	"net/http"
	"time"
)

func serveLogut(w http.ResponseWriter, r *http.Request) {
	loginCookie := &CookieValue{}
	go_utils.WriteCookie(w, encryptKey, cookieName, loginCookie)
}

func serveLogin(w http.ResponseWriter, r *http.Request) {
	//w.Header().Set("Content-Type", "application/json; charset=utf-8")
	csrfToken := go_utils.RandString(10)

	loginCookie := &CookieValue{}
	loginCookie.CsrfToken = csrfToken
	loginCookie.Expired = time.Now().Add(time.Duration(24) * time.Hour)
	go_utils.WriteCookie(w, encryptKey, cookieName, loginCookie)
	url := go_utils.CreateWxQyLoginUrl(corpId, agentId, redirectUri, csrfToken)
	log.Println("wx login url:", url)

	// 301 redirect: 301 代表永久性转移(Permanently Moved)。
	// 302 redirect: 302 代表暂时性转移(Temporarily Moved )。
	http.Redirect(w, r, url, 302)
}
