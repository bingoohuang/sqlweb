package main

import (
	"encoding/json"
	"github.com/bingoohuang/go-utils"
	"log"
	"net/http"
	"time"
)

type LoginResult struct {
	RedirectUrl string
}

func serveLogut(w http.ResponseWriter, req *http.Request) {
	loginCookie := &CookieValue{}
	go_utils.WriteCookie(w, encryptKey, cookieName, loginCookie)
}

func serveLogin(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	csrfToken := go_utils.RandString(10)

	loginCookie := &CookieValue{}
	loginCookie.CsrfToken = csrfToken
	loginCookie.Expired = time.Now().Add(time.Duration(24) * time.Hour)
	go_utils.WriteCookie(w, encryptKey, cookieName, loginCookie)
	url := go_utils.CreateWxQyLoginUrl(corpId, agentId, redirectUri, csrfToken)
	log.Println("wx login url:", url)

	queryResult := LoginResult{
		RedirectUrl: url,
	}

	json.NewEncoder(w).Encode(queryResult)
}
