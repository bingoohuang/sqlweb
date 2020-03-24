package sqlweb

import (
	"flag"
	"github.com/BurntSushi/toml"
	"github.com/bingoohuang/gou/htt"
	"github.com/bingoohuang/statiq/fs"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

func ServeFont(prefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := prefix + mux.Vars(r)["extension"]
		htt.ServeFavicon(path, MustAsset, AssetInfo)(w, r)
	}
}

func CommandExist(command string) bool {
	out, _ := exec.Command("which", command).Output()
	log.Println(command, string(out))
	return len(out) != 0
}

func TimeNow() string {
	return time.Now().Format("20060102150405")
}

var StaticFs *fs.StatiqFS
var MustAsset func(name string) []byte
var AssetInfo func(name string) (os.FileInfo, error)
var AssetNames []string

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

var AppConf AppConfig

var AuthParam htt.MustAuthParam

func init() {
	configFile := ""

	flag.StringVar(&configFile, "configFile", "appConfig.toml", "config file path")
	flag.StringVar(&configFile, "c", "appConfig.toml", "config file path(shorthand)")

	flag.Parse()
	if _, err := toml.DecodeFile(configFile, &AppConf); err != nil {
		log.Panic("config file decode error", err.Error())
	}

	if AppConf.ContextPath != "" && !strings.Contains(AppConf.ContextPath, "/") {
		AppConf.ContextPath = "/" + AppConf.ContextPath
	}

	AuthParam = htt.MustAuthParam{
		EncryptKey:  AppConf.EncryptKey,
		CookieName:  AppConf.CookieName,
		RedirectURI: AppConf.RedirectUri,
		LocalURL:    AppConf.LocalUrl,
		ForceLogin:  AppConf.ForceLogin,
	}
}
