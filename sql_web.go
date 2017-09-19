package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

var (
	contextPath       string
	port              int
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
	port = *portArg
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
	http.HandleFunc(contextPath+"/", gzipWrapper(serveHome))
	http.HandleFunc(contextPath+"/query", gzipWrapper(serveQuery))
	http.HandleFunc(contextPath+"/favicon.ico", serveFavicon)
	http.HandleFunc(contextPath+"/update", serveUpdate)
	http.HandleFunc(contextPath+"/searchDb", serveSearchDb)
	http.HandleFunc(contextPath+"/login", serveLogin)

	sport := strconv.Itoa(port)
	fmt.Println("start to listen at ", sport)
	if err := http.ListenAndServe(":"+sport, nil); err != nil {
		log.Fatal(err)
	}
}
