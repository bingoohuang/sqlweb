package main

import (
	"flag"
	"fmt"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
	"time"
	"runtime"
	"github.com/skratchdot/open-golang/open"
	"github.com/bingoohuang/go-utils"
)

var (
	contextPath       string
	port              string
	maxRows           int
	dataSource        string
	writeAuthRequired bool
	encryptKey        string

	corpId      string
	corpSecret  string
	agentId     string
	redirectUri string

	cookieName string
	devMode    bool // to disable css/js minify
)

func init() {
	contextPathArg := flag.String("contextPath", "", "context path")
	portArg := flag.Int("port", 8381, "Port to serve.")
	maxRowsArg := flag.Int("maxRows", 1000, "Max number of rows to return.")
	dataSourceArg := flag.String("dataSource", "user:pass@tcp(127.0.0.1:3306)/db?charset=utf8", "dataSource string.")
	writeAuthRequiredArg := flag.Bool("writeAuthRequired", true, "write auth required")
	keyArg := flag.String("key", "", "key to encyption or decyption")
	corpIdArg := flag.String("corpId", "", "corpId")
	corpSecretArg := flag.String("corpSecret", "", "cropId")
	agentIdArg := flag.String("agentId", "", "agentId")
	redirectUriArg := flag.String("redirectUri", "", "redirectUri")
	cookieNameArg := flag.String("cookieName", "easyhi_qyapi", "cookieName")
	devModeArg := flag.Bool("devMode", false, "devMode(disable js/css minify)")

	flag.Parse()

	contextPath = *contextPathArg
	port = strconv.Itoa(*portArg)
	maxRows = *maxRowsArg
	dataSource = *dataSourceArg
	writeAuthRequired = *writeAuthRequiredArg
	encryptKey = *keyArg
	corpId = *corpIdArg
	corpSecret = *corpSecretArg
	agentId = *agentIdArg
	redirectUri = *redirectUriArg
	cookieName = *cookieNameArg
	devMode = *devModeArg
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc(contextPath+"/", serveWelcome)
	r.HandleFunc(contextPath+"/home", gzipWrapper(go_utils.RandomPoemBasicAuth(serveHome)))
	r.HandleFunc(contextPath+"/query", gzipWrapper(go_utils.RandomPoemBasicAuth(serveQuery)))
	r.HandleFunc(contextPath+"/multipleTenantsQuery", gzipWrapper(go_utils.RandomPoemBasicAuth(multipleTenantsQuery)))
	r.HandleFunc(contextPath+"/tablesByColumn", go_utils.RandomPoemBasicAuth(serveTablesByColumn))
	r.HandleFunc(contextPath+"/loadLinksConfig", go_utils.RandomPoemBasicAuth(serveLoadLinksConfig))
	r.HandleFunc(contextPath+"/saveLinksConfig", go_utils.RandomPoemBasicAuth(serveSaveLinksConfig))
	r.HandleFunc(contextPath+"/iconfont.{extension}", serveFont)
	r.HandleFunc(contextPath+"/favicon.ico", serveFavicon)
	r.HandleFunc(contextPath+"/update", go_utils.RandomPoemBasicAuth(serveUpdate))
	r.HandleFunc(contextPath+"/searchDb", go_utils.RandomPoemBasicAuth(serveSearchDb))
	r.HandleFunc(contextPath+"/login", go_utils.RandomPoemBasicAuth(serveLogin))

	r.HandleFunc(contextPath+"/listVersion", go_utils.RandomPoemBasicAuth(serveListVersions))
	r.HandleFunc(contextPath+"/addVersion", go_utils.RandomPoemBasicAuth((serveAddVersion)))
	r.HandleFunc(contextPath+"/updateVersion", go_utils.RandomPoemBasicAuth(serveUpdateVersion))
	r.HandleFunc(contextPath+"/listVersionSqls", go_utils.RandomPoemBasicAuth(serveListVersionSqls))
	r.HandleFunc(contextPath+"/addVersionSql", go_utils.RandomPoemBasicAuth(serveAddVersionSql))
	r.HandleFunc(contextPath+"/updateVersionSql", go_utils.RandomPoemBasicAuth(serveUpdateVersionSql))
	r.HandleFunc(contextPath+"/deleteVersionSql", go_utils.RandomPoemBasicAuth(serveDeleteVersionSql))
	r.HandleFunc(contextPath+"/prepareExecuteVersionSql", go_utils.RandomPoemBasicAuth(servePrepareExecuteVersionSql))
	r.HandleFunc(contextPath+"/runExecuteVersionSql", go_utils.RandomPoemBasicAuth(serveRunExecuteVersionSql))

	http.Handle("/", r)

	fmt.Println("start to listen at ", port)
	go openExplorer(port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}


func openExplorer(port string) {
	time.Sleep(100 * time.Millisecond)

	switch runtime.GOOS {
	case "windows":
		fallthrough
	case "darwin":
		open.Run("http://127.0.0.1:" + port)
	}
}

func serveWelcome(w http.ResponseWriter, r *http.Request) {
	welcome := MustAsset("res/welcome.html")

	go_utils.ServeWelcome(w, welcome, contextPath)
}
