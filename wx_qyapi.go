package main

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

type WxLoginUserId struct {
	UserId  string `json:"UserId"`
	Errcode int    `json:"errcode"`
	Errmsg  string `json:"errmsg"`
}

// 企业微信：https://work.weixin.qq.com/

// refer https://work.weixin.qq.com/api/doc#10719
func getLoginUserId(accessToken, code string) (string, error) {
	url := "https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=" + accessToken + "&code=" + code
	log.Println("url:", url)
	resp, err := http.Get(url)
	log.Println("resp:", resp, ",err:", err)
	if err != nil {
		return "", err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var wxLoginUserId WxLoginUserId
	err = json.Unmarshal(body, &wxLoginUserId)
	if err != nil {
		return "", err
	}
	if wxLoginUserId.UserId == "" {
		return "", errors.New(string(body))
	}

	return wxLoginUserId.UserId, nil
}

type WxUserInfo struct {
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
	UserId string `json:"userid"`
}

func getUserInfo(accessToken, userId string) (*WxUserInfo, error) {
	url := "https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=" + accessToken + "&userid=" + userId
	log.Println("url:", url)
	resp, err := http.Get(url)
	log.Println("resp:", resp, ",err:", err)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var wxUserInfo WxUserInfo
	err = json.Unmarshal(body, &wxUserInfo)
	if err != nil {
		return nil, err
	}

	return &wxUserInfo, nil
}

type TokenResult struct {
	ErrCode          int    `json:"errcode"`
	ErrMsg           string `json:"errmsg"`
	AccessToken      string `json:"access_token"`
	ExpiresInSeconds int    `json:"expires_in"`
}

var (
	accessToken            string
	accessTokenExpiredTime time.Time
	accessTokenMutex       sync.Mutex
)

func getAccessToken(corpId, corpSecret string) (string, error) {
	accessTokenMutex.Lock()
	defer accessTokenMutex.Unlock()
	if accessToken != "" && accessTokenExpiredTime.After(time.Now()) {
		return accessToken, nil
	}

	url := "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=" + corpId + "&corpsecret=" + corpSecret
	log.Println("url:", url)
	resp, err := http.Get(url)
	log.Println("resp:", resp, ",err:", err)
	if err != nil {
		accessToken = ""
		return "", err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var tokenResult TokenResult
	json.Unmarshal(body, &tokenResult)
	if tokenResult.ErrCode == 0 {
		accessToken = tokenResult.AccessToken
		accessTokenExpiredTime = time.Now().Add(time.Duration(tokenResult.ExpiresInSeconds) * time.Second)
		return accessToken, nil
	}

	return "", errors.New(tokenResult.ErrMsg)
}

func createWxQyLoginUrl(cropId, agentId, redirectUri, csrfToken string) string {
	return "https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=" +
		cropId + "&agentid=" + agentId + "&redirect_uri=" + redirectUri + "&state=" + csrfToken
}

//func redirectWxQyLogin(w http.ResponseWriter, r *http.Request, url string) {
//	http.Redirect(w, r, url, 302) // Temporarily Move
//}

type CookieValue struct {
	UserId      string
	Name        string
	Avatar      string
	CsrfToken   string
	ExpiredTime string
}

func writeUserInfoCookie(w http.ResponseWriter, wxUserInfo *WxUserInfo) *CookieValue {
	value := CookieValue{
		UserId:      wxUserInfo.UserId,
		Name:        wxUserInfo.Name,
		Avatar:      wxUserInfo.Avatar,
		CsrfToken:   "",
		ExpiredTime: time.Now().Add(time.Duration(24) * time.Hour).Format(time.RFC3339),
	}
	cookieVal, _ := json.Marshal(value)

	cipher, _ := CBCEncrypt(encryptKey, string(cookieVal))
	cookie := http.Cookie{Name: cookieName, Value: cipher, Path: "/", MaxAge: 86400}
	http.SetCookie(w, &cookie)

	return &value
}

func writeCsrfTokenCookie(w http.ResponseWriter, csrfToken string) {
	cookieVal, err := json.Marshal(CookieValue{
		UserId:      "",
		Name:        "",
		Avatar:      "",
		CsrfToken:   csrfToken,
		ExpiredTime: time.Now().Add(time.Duration(24) * time.Hour).Format(time.RFC3339),
	})
	if err != nil {
		log.Println("json cookie error", err)
	}

	json := string(cookieVal)
	log.Println("csrf json:", json)
	cipher, err := CBCEncrypt(encryptKey, json)
	if err != nil {
		log.Println("CBCEncrypt cookie error", err)
	}

	cookie := http.Cookie{Name: cookieName, Value: cipher, Path: "/", MaxAge: 86400}
	http.SetCookie(w, &cookie)
}

func readLoginCookie(r *http.Request) *CookieValue {
	cookie, _ := r.Cookie(cookieName)
	if cookie == nil {
		return nil
	}

	log.Println("cookie value:", cookie.Value)
	decrypted, _ := CBCDecrypt(encryptKey, cookie.Value)
	if decrypted == "" {
		return nil
	}

	var cookieValue CookieValue
	err := json.Unmarshal([]byte(decrypted), &cookieValue)
	if err != nil {
		log.Println("unamrshal error:", err)
		return nil
	}

	log.Println("cookie parsed:", cookieValue, ",ExpiredTime:", cookieValue.ExpiredTime)

	expired, err := time.Parse(time.RFC3339, cookieValue.ExpiredTime)
	if err != nil {
		log.Println("time.Parse:", err)
	}
	if err != nil || expired.Before(time.Now()) {
		return nil
	}

	return &cookieValue
}

var r *rand.Rand // Rand for this package.

func init() {
	r = rand.New(rand.NewSource(time.Now().UnixNano()))
}

func RandomString(strlen int) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	result := ""
	for i := 0; i < strlen; i++ {
		index := r.Intn(len(chars))
		result += chars[index : index+1]
	}
	return result
}
