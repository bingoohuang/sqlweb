package main

import (
	"database/sql"
	"flag"
	"fmt"
	"github.com/bingoohuang/go-utils"
	"github.com/gorilla/mux"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

var (
	contextPath       string
	port              string
	maxRows           int
	g_dataSource      string
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

	northProxy string
	southProxy string
)

func init() {
	contextPathArg := flag.String("contextPath", "", "context path")
	portArg := flag.Int("port", 8381, "Port to serve.")
	maxRowsArg := flag.Int("maxRows", 1000, "Max number of rows to return.")
	dataSourceArg := flag.String("dataSource", "user:pass@tcp(127.0.0.1:3306)/?charset=utf8", "dataSource string.")
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

	northProxycArg := flag.String("northProxy", "http://127.0.0.1:8092", "northProxy")
	southProxycArg := flag.String("southProxy", "http://127.0.0.1:8082", "southProxy")

	flag.Parse()

	contextPath = *contextPathArg
	if contextPath != "" && strings.Index(contextPath, "/") < 0 {
		contextPath = "/" + contextPath
	}

	port = strconv.Itoa(*portArg)
	maxRows = *maxRowsArg
	g_dataSource = *dataSourceArg
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

	northProxy = *northProxycArg
	southProxy = *southProxycArg
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
	handleFunc(r, "/exportDatabase", exportDatabase, true, true)
	handleFunc(r, "/importDatabase", importDatabase, false, true)
	if multiTenants {
		handleFunc(r, "/multipleTenantsQuery", multipleTenantsQuery, true, true)
	}
	handleFunc(r, "/searchDb", serveSearchDb, false, true)
	if writeAuthRequired {
		handleFunc(r, "/login", serveLogin, false, true)
		handleFunc(r, "/logout", serveLogut, false, false)
	}

	handleFunc(r, "/action", serveAction, false, true)
	http.Handle("/", r)

	fmt.Println("start to listen at ", port)
	go_utils.OpenExplorerWithContext(contextPath, port)

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

func importDatabase(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(32 << 20)
	file, handler, err := r.FormFile("uploadfile")
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}
	defer file.Close()
	fmt.Fprintf(w, "%v", handler.Header)
	f, err := os.OpenFile("./"+handler.Filename, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}
	defer f.Close()
	io.Copy(f, file)

}

func exportDatabase(w http.ResponseWriter, r *http.Request) {
	if !authOk(r) {
		http.Error(w, "auth required!", http.StatusForbidden)
		return
	}

	tid := strings.TrimSpace(r.FormValue("tid"))

	tdb, err := searchMerchantDb(tid, g_dataSource)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	tn, err := searchMerchant(tid)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	w.Header().Set("Content-Transfer-Encoding", "binary")
	w.Header().Set("Content-Type", "text/plain")

	if CommandExist("mysqldump") {
		fileName := tn.MerchantCode + "." + time.Now().Format("20060102150405") + ".sql.gz"
		w.Header().Set("Content-Disposition", "attachment; filename="+fileName)

		log.Println("user system mysqldump to export database")
		mysqldump := "mysqldump -h  " + tdb.Host + " -P" + tdb.Port + " -u" + tdb.Username + " -p" + tdb.Password + "  " + tdb.Database + " | gzip"
		cmd := exec.Command("/bin/sh", "-c", mysqldump)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
		cmd.Start()

		io.Copy(w, stdout)
		stdout.Close()
	} else {
		fileName := tn.MerchantCode + "." + time.Now().Format("20060102150405") + ".sql"
		w.Header().Set("Content-Disposition", "attachment; filename="+fileName)
		log.Println("user custome mysqldump to export database")
		tenantDataSource, _, err := selectDb(tid, r)
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
		db, err := sql.Open("mysql", tenantDataSource)
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
		defer db.Close()

		err = go_utils.MySqlDump(db, w)
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
	}
}

func CommandExist(command string) bool {
	out, _ := exec.Command("which", command).Output()
	log.Println(command, string(out))
	return len(out) != 0
}

func serveWelcome(w http.ResponseWriter, r *http.Request) {
	if !authBasic {
		// fmt.Println("Redirect to", contextPath+"/home")
		// http.Redirect(w, r, contextPath+"/home", 301)
		serveHome(w, r)
	} else {
		welcome := MustAsset("res/welcome.html")
		go_utils.ServeWelcome(w, welcome, contextPath)
	}
}
