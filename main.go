package main

import (
	"fmt"
	"github.com/bingoohuang/go-utils"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func main() {
	r := mux.NewRouter()

	handleFunc(r, "/", serveWelcome, false, true)
	handleFunc(r, "/home", serveHome, true, true)
	handleFunc(r, "/query", serveQuery, true, true)
	handleFunc(r, "/tablesByColumn", serveTablesByColumn, false, true)
	handleFunc(r, "/loadLinksConfig", serveLoadLinksConfig, false, true)
	handleFunc(r, "/saveLinksConfig", serveSaveLinksConfig, false, true)
	handleFunc(r, "/iconfont.{extension}", serveFont("res/iconfont."), true, false)
	handleFunc(r, "/favicon.ico", go_utils.ServeFavicon("res/favicon.ico", MustAsset, AssetInfo), true, false)
	handleFunc(r, "/update", serveUpdate, false, true)
	handleFunc(r, "/exportDatabase", exportDatabase, true, true)
	if importDb {
		handleFuncNoDump(r, "/importDatabase", importDatabase, false, true)
	}
	if multiTenants {
		handleFunc(r, "/multipleTenantsQuery", multipleTenantsQuery, true, true)
	}
	handleFunc(r, "/searchDb", serveSearchDb, false, true)
	handleFunc(r, "/action", serveAction, false, true)
	http.Handle("/", r)

	fmt.Println("start to listen at ", port)
	go_utils.OpenExplorerWithContext(contextPath, port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleFuncNoDump(r *mux.Router, path string, f http.HandlerFunc, requiredGzip, requiredBasicAuth bool) {
	wrap := f
	if requiredBasicAuth && authBasic {
		wrap = go_utils.RandomPoemBasicAuth(wrap)
	}

	if requiredBasicAuth {
		wrap = go_utils.MustAuth(wrap, authParam)
	}

	if requiredGzip {
		wrap = go_utils.GzipHandlerFunc(wrap)
	}

	r.HandleFunc(contextPath+path, wrap)
}

func handleFunc(r *mux.Router, path string, f http.HandlerFunc, requiredGzip, requiredBasicAuth bool) {
	wrap := go_utils.DumpRequest(f)
	if requiredBasicAuth && authBasic {
		wrap = go_utils.RandomPoemBasicAuth(wrap)
	}

	if requiredBasicAuth {
		wrap = go_utils.MustAuth(wrap, authParam)
	}

	if requiredGzip {
		wrap = go_utils.GzipHandlerFunc(wrap)
	}

	r.HandleFunc(contextPath+path, wrap)
}

func serveWelcome(w http.ResponseWriter, r *http.Request) {
	if !authBasic || authParam.ForceLogin {
		// fmt.Println("Redirect to", contextPath+"/home")
		// http.Redirect(w, r, contextPath+"/home", 301)
		serveHome(w, r)
	} else {
		go_utils.ServeWelcome(w, MustAsset("res/welcome.html"), contextPath)
	}
}
