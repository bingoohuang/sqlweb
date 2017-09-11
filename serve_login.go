package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type LoginResult struct {
	RedirectUrl string
}

func serveLogin(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	csrfToken := RandomString(10)
	writeCsrfTokenCookie(w, csrfToken)
	url := createWxQyLoginUrl(corpId, agentId, redirectUri, csrfToken)
	log.Println("wx login url:", url)

	queryResult := LoginResult{
		RedirectUrl: url,
	}

	json.NewEncoder(w).Encode(queryResult)
}
