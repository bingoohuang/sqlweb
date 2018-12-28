package main

import (
	"flag"
	"github.com/BurntSushi/toml"
	"github.com/bingoohuang/go-utils"
	"log"
	"strings"
)

type YogaProxy struct {
	Proxy string
}

type AppConfig struct {
	ContextPath   string
	ListenPort    int
	MaxQueryRows  int
	DataSource    string
	DefaultTenant string
	TrrHomeArea   string

	DevMode       bool // to disable css/js minify
	AuthBasic     bool
	AuthBasicUser string
	AuthBasicPass string
	MultiTenants  bool
	ImportDb      bool

	YogaProxy map[string]YogaProxy

	EncryptKey  string
	CookieName  string
	RedirectUri string
	LocalUrl    string
	ForceLogin  bool

	WriteAuthUserNames []string // UserNames which has write auth
}

var configFile string
var appConfig AppConfig

var authParam go_utils.MustAuthParam

func init() {
	flag.StringVar(&configFile, "configFile", "appConfig.toml", "config file path")
	flag.StringVar(&configFile, "c", "appConfig.toml", "config file path(shorthand)")

	flag.Parse()
	if _, err := toml.DecodeFile(configFile, &appConfig); err != nil {
		log.Panic("config file decode error", err.Error())
	}

	if appConfig.ContextPath != "" && strings.Index(appConfig.ContextPath, "/") < 0 {
		appConfig.ContextPath = "/" + appConfig.ContextPath
	}

	authParam = go_utils.MustAuthParam{
		EncryptKey:  appConfig.EncryptKey,
		CookieName:  appConfig.CookieName,
		RedirectUri: appConfig.RedirectUri,
		LocalUrl:    appConfig.LocalUrl,
		ForceLogin:  appConfig.ForceLogin,
	}
}
