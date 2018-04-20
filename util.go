package main

import (
	"github.com/bingoohuang/go-utils"
	"net/http"
)

func authOk(r *http.Request) bool {
	if !writeAuthRequired {
		return true
	}
	loginCookie := &CookieValue{}
	err := go_utils.ReadCookie(r, encryptKey, cookieName, loginCookie)
	return err == nil && loginCookie.Name != ""
}
