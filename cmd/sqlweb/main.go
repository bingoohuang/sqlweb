package main

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/http/httputil"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/bingoohuang/gou/htt"
	"github.com/bingoohuang/gou/poem"

	"github.com/bingoohuang/sqlweb"
	"github.com/bingoohuang/statiq/fs"
	"github.com/gorilla/mux"

	_ "github.com/bingoohuang/sqlweb/statiq"
)

func init() {
	sqlweb.StaticFs, _ = fs.New()
	sqlweb.MustAsset = func(name string) []byte {
		return sqlweb.StaticFs.Files["/"+name].Data
	}

	sqlweb.AssetNames = make([]string, 0, len(sqlweb.StaticFs.Files))
	for k := range sqlweb.StaticFs.Files {
		sqlweb.AssetNames = append(sqlweb.AssetNames, k[1:])
	}

	sqlweb.AssetInfo = func(name string) (info os.FileInfo, e error) {
		f, err := sqlweb.StaticFs.Open("/" + name)
		if err != nil {
			return nil, err
		}

		return f.Stat()
	}
}

func main() {
	r := mux.NewRouter()
	handleFunc(r, "/", serveWelcome, false, true)
	handleFunc(r, "/home", sqlweb.ServeHome, true, true)
	handleFunc(r, "/query", sqlweb.ServeQuery, true, true)
	handleFunc(r, "/downloadColumn", sqlweb.DownloadColumn, true, true)
	handleFunc(r, "/tablesByColumn", sqlweb.ServeTablesByColumn, false, true)
	handleFunc(r, "/loadLinksConfig", sqlweb.ServeLoadLinksConfig, false, true)
	handleFunc(r, "/saveLinksConfig", sqlweb.ServeSaveLinksConfig, false, true)
	handleFunc(r, "/iconfont.{extension}", sqlweb.ServeFont("iconfont."), true, false)
	handleFunc(r, "/favicon.ico", htt.ServeFavicon("favicon.ico", sqlweb.MustAsset, sqlweb.AssetInfo), true, false)
	handleFunc(r, "/update", sqlweb.ServeUpdate, false, true)
	handleFunc(r, "/exportDatabase", sqlweb.ExportDatabase, true, true)
	if sqlweb.AppConf.ImportDb {
		handleFuncNoDump(r, "/importDatabase", sqlweb.ImportDatabase, false, true)
	}
	if sqlweb.AppConf.MultiTenants {
		handleFunc(r, "/multipleTenantsQuery", sqlweb.MultipleTenantsQuery, true, true)
	}
	handleFunc(r, "/searchDb", sqlweb.ServeSearchDb, false, true)
	handleFunc(r, "/action", sqlweb.ServeAction, false, true)

	http.HandleFunc("/static/", ServeStatic())
	http.Handle("/", r)

	fmt.Println("start to listen at ", sqlweb.AppConf.ListenPort)
	htt.OpenExplorerWithContext(sqlweb.AppConf.ContextPath, strconv.Itoa(sqlweb.AppConf.ListenPort))

	if err := http.ListenAndServe(":"+strconv.Itoa(sqlweb.AppConf.ListenPort), nil); err != nil {
		log.Fatal(err)
	}
}

func ServeStatic() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filename := r.URL.Path[1:]
		fi, _ := sqlweb.AssetInfo(filename)
		if fi == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		buffer := bytes.NewReader(sqlweb.MustAsset(filename))
		w.Header().Set("Content-Type", DetectContentType(fi.Name()))
		w.Header().Set("Last-Modified", fi.ModTime().UTC().Format(http.TimeFormat))
		w.WriteHeader(http.StatusOK)
		io.Copy(w, buffer)
	}
}

func DetectContentType(name string) (t string) {
	if t = mime.TypeByExtension(filepath.Ext(name)); t == "" {
		t = "application/octet-stream"
	}

	return
}

type GzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w GzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func GzipHandlerFunc(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			fn(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		gzr := GzipResponseWriter{Writer: gz, ResponseWriter: w}
		fn(gzr, r)
	}
}

func DumpRequest(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Save a copy of this request for debugging.
		requestDump, err := httputil.DumpRequest(r, true)
		if err != nil {
			log.Println(err)
		}
		log.Println(string(requestDump))
		fn(w, r)
	}
}

func handleFuncNoDump(r *mux.Router, path string, f http.HandlerFunc, requiredGzip, requiredBasicAuth bool) {
	wrap := f
	if requiredBasicAuth && sqlweb.AppConf.AuthBasic {
		wrap = poem.RandomPoemBasicAuth(wrap)
	}

	if requiredBasicAuth {
		wrap = htt.MustAuth(wrap, sqlweb.AuthParam, "CookieValue")
	}

	if requiredGzip {
		wrap = GzipHandlerFunc(wrap)
	}

	r.HandleFunc(sqlweb.AppConf.ContextPath+path, wrap)
}

func handleFunc(r *mux.Router, path string, f http.HandlerFunc, requiredGzip, requiredBasicAuth bool) {
	wrap := DumpRequest(f)
	if requiredBasicAuth && sqlweb.AppConf.AuthBasic {
		if sqlweb.AppConf.AuthBasicUser != "" {
			wrap = BasicAuth(wrap, sqlweb.AppConf.AuthBasicUser, sqlweb.AppConf.AuthBasicPass)
		}
	}

	if requiredBasicAuth {
		wrap = htt.MustAuth(wrap, sqlweb.AuthParam, "CookieValue")
	}

	if requiredGzip {
		wrap = GzipHandlerFunc(wrap)
	}

	r.HandleFunc(sqlweb.AppConf.ContextPath+path, wrap)
}

func serveWelcome(w http.ResponseWriter, r *http.Request) {
	if !sqlweb.AppConf.AuthBasic || sqlweb.AuthParam.ForceLogin || sqlweb.AppConf.AuthBasicUser != "" {
		// fmt.Println("Redirect to", contextPath+"/home")
		// http.Redirect(w, r, contextPath+"/home", 301)
		sqlweb.ServeHome(w, r)
	} else {
		poem.ServeWelcome(w, sqlweb.MustAsset("welcome.html"), sqlweb.AppConf.ContextPath)
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
