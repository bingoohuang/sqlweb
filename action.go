package main

import (
	"errors"
	"github.com/bingoohuang/go-utils"
	"net/http"
	"net/url"
	"strings"
)

type Action interface {
	Execute() ([]byte, error)
}

type SetCaptchaAction struct {
	Tenant *Merchant
	Mobile string
}

func (t *SetCaptchaAction) Execute() ([]byte, error) {
	proxy := findProxy(t.Tenant.HomeArea)
	keyTemplate := findCaptchaKeyTemplate(t.Tenant.Classifier)

	key := strings.Replace(keyTemplate, "{mobile}", t.Mobile, -1)
	httpResult, err := go_utils.HttpGet(proxy + "/setCache?key=" + url.QueryEscape(key) + "&value=1234&ttl=60s")
	if err != nil {
		return nil, err
	}

	return httpResult, nil
}

func findCaptchaKeyTemplate(classifier string) string {
	if strings.Contains(classifier, "yoga") {
		return "captcha:{mobile}:/login"
	}
	if strings.Contains(classifier, "et") {
		return "captcha:{mobile}:/login/sms"
	}
	return ""
}

func findProxy(homeArea string) string {
	if strings.Contains(homeArea, "south") {
		return southProxy
	}
	if strings.Contains(homeArea, "north") {
		return northProxy
	}
	return ""
}

type UnknownAction struct {
}

func (t *UnknownAction) Execute() ([]byte, error) {
	return nil, errors.New("unknown action")
}

func serveAction(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	if !authOk(r) {
		http.Error(w, "auth required!", http.StatusForbidden)
		return
	}

	tid := strings.TrimSpace(r.FormValue("tid"))
	action := strings.TrimSpace(r.FormValue("action"))
	value := strings.TrimSpace(r.FormValue("value"))

	if tid == "" || action == "" || value == "" {
		http.Error(w, "tid/action/value required", 405)
		return
	}

	merchant, err := searchMerchant(tid)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	act := findAction(action, merchant, value)

	s, err := act.Execute()
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	w.Write(s)
}

func findAction(action string, merchant *Merchant, value string) Action {
	if action == "SetCaptcha" {
		return &SetCaptchaAction{Tenant: merchant, Mobile: value}
	}

	return &UnknownAction{}
}
