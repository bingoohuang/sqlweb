package main

import (
	"github.com/bingoohuang/go-utils"
	"net/http"
)

func authOk(r *http.Request) bool {
	if !writeAuthRequired {
		return true
	}

	loginCookie := go_utils.ReadLoginCookie(r, encryptKey, cookieName)
	if loginCookie != nil && loginCookie.Name != "" {
		return true
	}

	return false
}
