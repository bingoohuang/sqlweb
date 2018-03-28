package main

import (
	"flag"
	"fmt"
	"github.com/bingoohuang/go-utils"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
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

	cookieName   string
	devMode      bool // to disable css/js minify
	authBasic    bool
	multiTenants bool
)

func init() {
	contextPathArg := flag.String("contextPath", "", "context path")
	portArg := flag.Int("port", 8381, "Port to serve.")
	maxRowsArg := flag.Int("maxRows", 1000, "Max number of rows to return.")
	dataSourceArg := flag.String("dataSource", "user:pass@tcp(127.0.0.1:3306)/db?charset=utf8", "dataSource string.")
	writeAuthRequiredArg := flag.Bool("writeAuthRequired", false, "write auth required")
	keyArg := flag.String("key", "", "key to encryption or decryption")
	corpIdArg := flag.String("corpId", "", "corpId")
	corpSecretArg := flag.String("corpSecret", "", "cropId")
	agentIdArg := flag.String("agentId", "", "agentId")
	redirectUriArg := flag.String("redirectUri", "", "redirectUri")
	cookieNameArg := flag.String("cookieName", "easyhi_qyapi", "cookieName")
	devModeArg := flag.Bool("devMode", false, "devMode(disable js/css minify)")
	authBasicArg := flag.Bool("authBasic", false, "authBasic based on poems")
	multiTenantsArg := flag.Bool("multiTenants", false, "support multiTenants")

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
	authBasic = *authBasicArg
	multiTenants = *multiTenantsArg
}

func main() {
	r := mux.NewRouter()

	handleFunc(r, "/", serveWelcome, false, false)
	handleFunc(r, "/home", serveHome, true, true)
	handleFunc(r, "/query", serveQuery, true, true)
	handleFunc(r, "/tablesByColumn", serveTablesByColumn, false, true)
	handleFunc(r, "/loadLinksConfig", serveLoadLinksConfig, false, true)
	handleFunc(r, "/saveLinksConfig", serveSaveLinksConfig, false, true)
	handleFunc(r, "/iconfont.{extension}", serveFont, true, false)
	handleFunc(r, "/favicon.ico", serveFavicon, true, false)
	handleFunc(r, "/update", serveUpdate, false, true)
	if multiTenants {
		handleFunc(r, "/multipleTenantsQuery", multipleTenantsQuery, true, true)
	}
	handleFunc(r, "/searchDb", serveSearchDb, false, true)
	if writeAuthRequired {
		handleFunc(r, "/login", serveLogin, false, true)
	}
	http.Handle("/", r)

	fmt.Println("start to listen at ", port)
	go_utils.OpenExplorer(port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleFunc(r *mux.Router, path string, f func(http.ResponseWriter, *http.Request), requiredGzip, requiredBasicAuth bool) {
	wrap := go_utils.DumpRequest(f)
	if requiredBasicAuth && authBasic {
		wrap = go_utils.RandomPoemBasicAuth(wrap)
	}

	if requiredGzip {
		wrap = go_utils.GzipHandlerFunc(wrap)
	}

	r.HandleFunc(contextPath+path, wrap)
}

func serveWelcome(w http.ResponseWriter, r *http.Request) {
	if !authBasic {
		fmt.Println("Redirect to", contextPath+"/home")
		http.Redirect(w, r, contextPath+"/home", 301)
	} else {
		welcome := MustAsset("res/welcome.html")
		go_utils.ServeWelcome(w, welcome, contextPath)
	}
}
