package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"github.com/bingoohuang/gou"
	"github.com/bingoohuang/statiq/fs"
	"github.com/gorilla/mux"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	_ "github.com/bingoohuang/go-sql-web/statiq"
)

var StaticFs *fs.StatiqFS
var MustAsset func(name string) []byte
var AssetInfo func(name string) (os.FileInfo, error)
var AssetNames []string

func init() {
	StaticFs, _ = fs.New()
	MustAsset = func(name string) []byte {
		return StaticFs.Files["/"+name].Data
	}

	AssetNames = make([]string, 0, len(StaticFs.Files))
	for k := range StaticFs.Files {
		AssetNames = append(AssetNames, k[1:])
	}

	AssetInfo = func(name string) (info os.FileInfo, e error) {
		f, err := StaticFs.Open("/" + name)
		if err != nil {
			return nil, err
		}

		return f.Stat()
	}
}

func main() {
	//defer gou.Recover()

	r := mux.NewRouter()
	handleFunc(r, "/", serveWelcome, false, true)
	handleFunc(r, "/home", serveHome, true, true)
	handleFunc(r, "/query", serveQuery, true, true)
	handleFunc(r, "/downloadColumn", downloadColumn, true, true)
	handleFunc(r, "/tablesByColumn", serveTablesByColumn, false, true)
	handleFunc(r, "/loadLinksConfig", serveLoadLinksConfig, false, true)
	handleFunc(r, "/saveLinksConfig", serveSaveLinksConfig, false, true)
	handleFunc(r, "/iconfont.{extension}", serveFont("iconfont."), true, false)
	handleFunc(r, "/favicon.ico", gou.ServeFavicon("favicon.ico", MustAsset, AssetInfo), true, false)
	handleFunc(r, "/update", serveUpdate, false, true)
	handleFunc(r, "/exportDatabase", exportDatabase, true, true)
	if appConfig.ImportDb {
		handleFuncNoDump(r, "/importDatabase", importDatabase, false, true)
	}
	if appConfig.MultiTenants {
		handleFunc(r, "/multipleTenantsQuery", multipleTenantsQuery, true, true)
	}
	handleFunc(r, "/searchDb", serveSearchDb, false, true)
	handleFunc(r, "/action", serveAction, false, true)

	http.HandleFunc("/static/", ServeStatic())
	http.Handle("/", r)

	fmt.Println("start to listen at ", appConfig.ListenPort)
	gou.OpenExplorerWithContext(appConfig.ContextPath, strconv.Itoa(appConfig.ListenPort))

	if err := http.ListenAndServe(":"+strconv.Itoa(appConfig.ListenPort), nil); err != nil {
		log.Fatal(err)
	}
}

func ServeStatic() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filename := r.URL.Path[1:]
		fi, _ := AssetInfo(filename)
		if fi == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		buffer := bytes.NewReader(MustAsset(filename))
		w.Header().Set("Content-Type", gou.DetectContentType(fi.Name()))
		w.Header().Set("Last-Modified", fi.ModTime().UTC().Format(http.TimeFormat))
		w.WriteHeader(http.StatusOK)
		io.Copy(w, buffer)
	}
}

func handleFuncNoDump(r *mux.Router, path string, f http.HandlerFunc, requiredGzip, requiredBasicAuth bool) {
	wrap := f
	if requiredBasicAuth && appConfig.AuthBasic {
		wrap = gou.RandomPoemBasicAuth(wrap)
	}

	if requiredBasicAuth {
		wrap = gou.MustAuth(wrap, authParam)
	}

	if requiredGzip {
		wrap = gou.GzipHandlerFunc(wrap)
	}

	r.HandleFunc(appConfig.ContextPath+path, wrap)
}

func handleFunc(r *mux.Router, path string, f http.HandlerFunc, requiredGzip, requiredBasicAuth bool) {
	wrap := gou.DumpRequest(f)
	if requiredBasicAuth && appConfig.AuthBasic {
		if appConfig.AuthBasicUser != "" {
			wrap = BasicAuth(wrap, appConfig.AuthBasicUser, appConfig.AuthBasicPass)
		} else {
			wrap = gou.RandomPoemBasicAuth(wrap)
		}
	}

	if requiredBasicAuth {
		wrap = gou.MustAuth(wrap, authParam)
	}

	if requiredGzip {
		wrap = gou.GzipHandlerFunc(wrap)
	}

	r.HandleFunc(appConfig.ContextPath+path, wrap)
}

func serveWelcome(w http.ResponseWriter, r *http.Request) {
	if !appConfig.AuthBasic || authParam.ForceLogin || appConfig.AuthBasicUser != "" {
		// fmt.Println("Redirect to", contextPath+"/home")
		// http.Redirect(w, r, contextPath+"/home", 301)
		serveHome(w, r)
	} else {
		gou.ServeWelcome(w, MustAsset("welcome.html"), appConfig.ContextPath)
	}
}

func BasicAuth(fn http.HandlerFunc, user, pass string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		basicAuthPrefix := "Basic "

		// 获取 request header
		auth := r.Header.Get("Authorization")
		// 如果是 http basic auth
		if strings.HasPrefix(auth, basicAuthPrefix) {
			// 解码认证信息
			payload, err := base64.StdEncoding.DecodeString(auth[len(basicAuthPrefix):])
			if err == nil {
				pair := bytes.SplitN(payload, []byte(":"), 2)

				if len(pair) == 2 {
					if user == string(pair[0]) && pass == string(pair[1]) {
						fn(w, r) // 执行被装饰的函数
						return
					}
				}
			}
		}

		w.Header().Set("Content-Type", "'Content-type:text/html;charset=ISO-8859-1'")
		// 认证失败，提示 401 Unauthorized
		w.Header().Set("WWW-Authenticate", `Basic realm="Restricted"`)
		// 401 状态码
		w.WriteHeader(http.StatusUnauthorized)
	}
}
