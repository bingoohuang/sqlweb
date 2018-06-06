package main

import (
	"errors"
	"github.com/bingoohuang/go-utils"
	"net/http"
	"net/url"
	"strings"
)

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

	act := findAction(action, merchant, value, r)
	s, err := act.Execute()
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	w.Write(s)
}

type Action interface {
	Execute() ([]byte, error)
}

func findProxy(homeArea string) (string, error) {
	if strings.Contains(homeArea, "south") {
		return southProxy, nil
	} else if strings.Contains(homeArea, "north") {
		return northProxy, nil
	}
	return "", errors.New("unknown homeArea " + homeArea)
}

type UnknownAction struct {
}

func (t *UnknownAction) Execute() ([]byte, error) {
	return nil, errors.New("unknown action")
}

type CacheAction struct {
	Tenant *Merchant
	Key    string
	Value  string
	Ttl    string
	Op     string // Set/Get/Clear
}

func (t *CacheAction) Execute() ([]byte, error) {
	proxy, err := findProxy(t.Tenant.HomeArea)
	if err != nil {
		return nil, err
	}

	if t.Op == "Get" {
		return go_utils.HttpGet(proxy + "/getCache?key=" + url.QueryEscape(t.Key))
	} else if t.Op == "Set" {
		return go_utils.HttpGet(proxy + "/setCache?key=" + url.QueryEscape(t.Key) + "&value=" + t.Value + "&ttl=" + t.Ttl)
	} else if t.Op == "Clear" {
		return go_utils.HttpGet(proxy + "/clearCache?keys=" + url.QueryEscape(t.Key))
	} else {
		return nil, errors.New("unknown Operation " + t.Op)
	}
}

func findAction(action string, merchant *Merchant, value string, r *http.Request) Action {
	if action == "CacheAction" {
		return &CacheAction{
			Tenant: merchant,
			Key:    strings.TrimSpace(r.FormValue("key")),
			Value:  value,
			Ttl:    strings.TrimSpace(r.FormValue("ttl")),
			Op:     strings.TrimSpace(r.FormValue("op")),
		}
	}

	return &UnknownAction{}
}
