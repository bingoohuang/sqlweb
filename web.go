package sqlweb

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"text/template"
	"time"

	"github.com/bingoohuang/gou/file"

	"github.com/bingoohuang/gou/htt"
	"github.com/bingoohuang/statiq/fs"
	"github.com/bingoohuang/toml"
	"github.com/gorilla/mux"
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
	BasicAuth    []string
	MultiTenants bool
	ImportDb     bool

	ActionProxy map[string]ActionProxy

	EncryptKey  string
	CookieName  string
	RedirectUri string
	LocalUrl    string
	ForceLogin  bool
	// 是否只显示sqlweb表定义的库，不自动补充show databases()的库列表
	OnlyShowSqlWebDatabases bool

	WriteAuthUserNames []string // UserNames which has write auth
}

var AppConf AppConfig

func InitConf() {
	configFile := ""

	ctlFlag := flag.Bool("i", false, "create sample ctl/sqlweb.toml file")
	flag.StringVar(&configFile, "c", "sqlweb.toml", "config file paths")
	flag.Parse()

	if *ctlFlag {
		if err := ipoInit(); err != nil {
			fmt.Println(err)
		}
		os.Exit(0)
	}

	createDefaultConfigFile(configFile)

	if _, err := toml.DecodeFile(configFile, &AppConf); err != nil {
		log.Panic("config file decode error", err.Error())
	}

	if AppConf.ContextPath != "" && !strings.HasPrefix(AppConf.ContextPath, "/") {
		AppConf.ContextPath = "/" + AppConf.ContextPath
	}

	if AppConf.DefaultDB == "" {
		_, rows, _, _, _, _ := executeQuery("SELECT DATABASE()", AppConf.DSN, 0)
		if len(rows) > 0 {
			AppConf.DefaultDB = rows[0][1]
		}
	}
}

func createDefaultConfigFile(configFile string) {
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		ioutil.WriteFile(configFile, []byte(`
ContextPath = "sqlweb"
ListenPort  = 8381
#MaxQueryRows  = 1000
DSN = "root:root@tcp(127.0.0.1:3306)/information_schema?charset=utf8"
#DevMode = true
#BasicAuth= ["admin:admin"]
#MultiTenants = true
#ImportDb = false
#DefaultDB = ""
`), 0644)
	}
}

func ipoInit() error {
	if err := InitCtl("ctl.tpl.sh", "./ctl"); err != nil {
		return err
	}

	if err := InitCfgFile("cnf.tpl.toml", "./sqlweb.toml"); err != nil {
		return err
	}

	return nil
}

// InitCfgFile initializes the cfg file.
func InitCfgFile(configTplFileName, configFileName string) error {
	if file.Stat(configFileName) == file.Exists {
		fmt.Printf("%s already exists, ignored!\n", configFileName)
		return nil
	}

	conf := MustAsset(configTplFileName)
	// 0644->即用户具有读写权限，组用户和其它用户具有只读权限；
	if err := ioutil.WriteFile(configFileName, conf, 0644); err != nil {
		return err
	}

	fmt.Println(configFileName + " created!")

	return nil
}

// InitCtl initializes the ctl file.
func InitCtl(ctlTplName, ctlFilename string) error {
	if file.Stat(ctlFilename) == file.Exists {
		fmt.Println(ctlFilename + " already exists, ignored!")
		return nil
	}

	ctl := string(MustAsset(ctlTplName))
	tpl, err := template.New(ctlTplName).Parse(ctl)

	if err != nil {
		return err
	}

	binArgs := argsExcludeInit()

	m := map[string]string{"BinName": os.Args[0], "BinArgs": strings.Join(binArgs, " ")}

	var content bytes.Buffer
	if err := tpl.Execute(&content, m); err != nil {
		return err
	}

	// 0755->即用户具有读/写/执行权限，组用户和其它用户具有读写权限；
	if err = ioutil.WriteFile(ctlFilename, content.Bytes(), 0755); err != nil {
		return err
	}

	fmt.Println(ctlFilename + " created!")

	return nil
}

func argsExcludeInit() []string {
	binArgs := make([]string, 0, len(os.Args)-2) // nolint gomnd

	for i, arg := range os.Args {
		if i == 0 {
			continue
		}

		if strings.Index(arg, "-i") == 0 || strings.Index(arg, "--init") == 0 {
			continue
		}

		if strings.Index(arg, "-") != 0 {
			arg = strconv.Quote(arg)
		}

		binArgs = append(binArgs, arg)
	}

	return binArgs
}
