package sqlweb

import (
	"flag"
	"github.com/BurntSushi/toml"
	"github.com/bingoohuang/gou/htt"
	"github.com/bingoohuang/statiq/fs"
	"github.com/gorilla/mux"
	"io/ioutil"
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

type ActionProxy struct {
	Proxy string
}

type AppConfig struct {
	ContextPath  string
	ListenPort   int
	MaxQueryRows int
	DSN          string
	DefaultDB    string
	TrrHomeArea  string

	DevMode      bool // to disable css/js minify
	BasicAuth    string
	MultiTenants bool
	ImportDb     bool

	ActionProxy map[string]ActionProxy

	EncryptKey  string
	CookieName  string
	RedirectUri string
	LocalUrl    string
	ForceLogin  bool

	WriteAuthUserNames []string // UserNames which has write auth
}

var AppConf AppConfig

func init() {
	configFile := ""

	flag.StringVar(&configFile, "c", "sqlweb.toml", "config file paths")
	flag.Parse()

	createDefaultConfigFile(configFile)

	if _, err := toml.DecodeFile(configFile, &AppConf); err != nil {
		log.Panic("config file decode error", err.Error())
	}

	if AppConf.ContextPath != "" && !strings.HasPrefix(AppConf.ContextPath, "/") {
		AppConf.ContextPath = "/" + AppConf.ContextPath
	}
}

func createDefaultConfigFile(configFile string) {
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		ioutil.WriteFile(configFile, []byte(`
#ContextPath = ""
ListenPort  = 8381
#MaxQueryRows  = 1000
DSN = "root:root@tcp(127.0.0.1:3306)/information_schema?charset=utf8"
#DevMode = true
#BasicAuth= "admin:admin"
#MultiTenants = true
#ImportDb = false
#DefaultDB = ""
`), 0644)
	}
}
