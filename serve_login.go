package main

import (
	"encoding/json"
	"github.com/bingoohuang/go-utils"
	"log"
	"net/http"
)

type LoginResult struct {
	RedirectUrl string
}

func serveLogin(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	csrfToken := go_utils.RandString(10)
	go_utils.WriteCsrfTokenCookie(w, encryptKey, cookieName, csrfToken)
	url := go_utils.CreateWxQyLoginUrl(corpId, agentId, redirectUri, csrfToken)
	log.Println("wx login url:", url)

	queryResult := LoginResult{
		RedirectUrl: url,
	}

	json.NewEncoder(w).Encode(queryResult)
}
