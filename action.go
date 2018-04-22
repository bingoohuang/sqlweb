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
	keyTemplate := ""
	if strings.Contains(t.Tenant.Classifier, "yoga") {
		keyTemplate = "captcha:{mobile}:/login"
	} else if strings.Contains(t.Tenant.Classifier, "et") {
		keyTemplate = "captcha:{mobile}:/login/sms"
	}

	key := strings.Replace(keyTemplate, "{mobile}", t.Mobile, -1)
	return go_utils.HttpGet(proxy + "/setCache?key=" + url.QueryEscape(key) + "&value=1234&ttl=60s")
}

func findProxy(homeArea string) string {
	if strings.Contains(homeArea, "south") {
		return southProxy
	} else if strings.Contains(homeArea, "north") {
		return northProxy
	}
	return ""
}

type UnknownAction struct {
}

func (t *UnknownAction) Execute() ([]byte, error) {
	return nil, errors.New("unknown action")
}

type ClearMerchantConfigCacheAction struct {
	Tenant *Merchant
}

func (t *ClearMerchantConfigCacheAction) Execute() ([]byte, error) {
	keys := ""
	if strings.Contains(t.Tenant.Classifier, "yoga") {
		keys = "westcache:yoga:" + t.Tenant.MerchantCode + ":MerchantConfigBoService.getMerchantConfig," +
			"westcache:yoga:" + t.Tenant.MerchantCode + ":ConfigService.getAllConfigs"
	} else if strings.Contains(t.Tenant.Classifier, "et") {
		keys = "westcache:et:" + t.Tenant.MerchantCode + ":MerchantConfigDaoImpl.queryMerchantConfigItems"
	}

	proxy := findProxy(t.Tenant.HomeArea)
	return go_utils.HttpGet(proxy + "/clearCache?keys=" + url.QueryEscape(keys))
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
	} else if action == "ClearMerchantConfigCache" {
		return &ClearMerchantConfigCacheAction{Tenant: merchant}
	}

	return &UnknownAction{}
}
