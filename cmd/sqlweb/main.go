package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/base64"
	"fmt"
	"github.com/bingoohuang/gou/htt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/http/httputil"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/bingoohuang/sqlweb"
	"github.com/gorilla/mux"
)

func init() {
	sqlweb.InitConf()
}

func main() {
	r := mux.NewRouter().StrictSlash(true)
	handleFunc(r, "/", sqlweb.ServeHome, false, true)
	handleFunc(r, "/home", sqlweb.ServeHome, true, true)
	handleFunc(r, "/query", sqlweb.ServeQuery, true, true)
	handleFunc(r, "/downloadColumn", sqlweb.DownloadColumn, true, true)
	handleFunc(r, "/tablesByColumn", sqlweb.ServeTablesByColumn, false, true)
	handleFunc(r, "/loadLinksConfig", sqlweb.ServeLoadLinksConfig, false, true)
	handleFunc(r, "/saveLinksConfig", sqlweb.ServeSaveLinksConfig, false, true)
	handleFunc(r, "/iconfont.{extension}", sqlweb.ServeFont("iconfont."), true, false)
	handleFunc(r, "/favicon.ico", htt.ServeFavicon("favicon.ico", sqlweb.MustAsset, sqlweb.AssetInfo), true, false)
	handleFunc(r, "/update", sqlweb.WrapHandlerFunc(sqlweb.ServeUpdate), false, true)
	handleFunc(r, "/exportDatabase", sqlweb.ExportDatabase, true, true)
	if sqlweb.AppConf.ImportDb {
		handleFuncNoDump(r, "/importDatabase", sqlweb.ImportDatabase, false)
	}
	handleFunc(r, "/multipleTenantsQuery", sqlweb.TenantsQuery, true, true)
	handleFunc(r, "/searchDb", sqlweb.ServeSearchDb, false, true)
	handleFunc(r, "/action", sqlweb.ServeAction, false, true)

	http.HandleFunc(sqlweb.AppConf.ContextPath+"/static/", ServeStatic(sqlweb.AppConf.ContextPath))
	http.Handle("/", r)

	fmt.Println("start to listen at ", sqlweb.AppConf.ListenPort)
	if err := http.ListenAndServe(":"+strconv.Itoa(sqlweb.AppConf.ListenPort), nil); err != nil {
		log.Fatal(err)
	}
}

func ServeStatic(contextPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filename := strings.TrimPrefix(r.URL.Path, contextPath)[1:]
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

func handleFuncNoDump(r *mux.Router, path string, f http.HandlerFunc, requiredGzip bool) {
	wrap := f

	if requiredGzip {
		wrap = GzipHandlerFunc(wrap)
	}

	r.HandleFunc(sqlweb.AppConf.ContextPath+path, wrap)
}

func handleFunc(r *mux.Router, path string, f http.HandlerFunc, requiredGzip, requiredBasicAuth bool) {
	wrap := DumpRequest(f)
	if requiredBasicAuth && sqlweb.AppConf.BasicAuthRequired() {
		wrap = BasicAuth(wrap, sqlweb.AppConf)
	} else {
		wrap = anonymousWrap(wrap)
	}

	if requiredGzip {
		wrap = GzipHandlerFunc(wrap)
	}

	p := filepath.Join(sqlweb.AppConf.ContextPath, path)
	if p != "/" {
		p = strings.TrimSuffix(p, "/")
	}

	r.HandleFunc(p, wrap)
}

func anonymousWrap(f http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rr := r.WithContext(context.WithValue(r.Context(), sqlweb.LoginUserKey, &sqlweb.LoginUser{
			Name: "anonymous",
		}))
		f(w, rr)
	}
}

const prefix = "Basic "

func BasicAuth(fn http.HandlerFunc, conf sqlweb.AppConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if strings.HasPrefix(auth, prefix) {
			payload, _ := base64.StdEncoding.DecodeString(auth[len(prefix):]) // 解码认证信息
			if user, groupIndices := Contains(conf.BasicAuthGroups, string(payload)); user != "" {
				rr := r.WithContext(context.WithValue(r.Context(), sqlweb.LoginUserKey,
					&sqlweb.LoginUser{
						Name:            user,
						DSNGroups:       groupIndices,
						DefaultDB:       parseDefaultDB(groupIndices, conf),
						Limit2ConfigDSN: len(conf.BasicAuthGroups) > 1,
					}))
				fn(w, rr) // 执行被装饰的函数
				return
			}
		}

		w.Header().Set("Content-Type", "'Content-type:text/html;charset=ISO-8859-1'")
		// 认证失败，提示 401 Unauthorized
		w.Header().Set("WWW-Authenticate", `Basic realm="Restricted"`)
		// 401 状态码
		w.WriteHeader(http.StatusUnauthorized)
	}
}

func parseDefaultDB(groupIndices []int, conf sqlweb.AppConfig) int {
	for _, gi := range groupIndices {
		if gi > 0 && conf.DSNS[gi-1].DefaultDB {
			return gi
		}
	}

	return groupIndices[0]
}

func Contains(groups [][]string, s string) (string, []int) {
	var ii []int
	user := ""

	for i, ss := range groups {
		for _, el := range ss {
			if s == el {
				user = el[:strings.Index(el, ":")]
				if i == 0 { // 全局basic group
					for j := 0; j < len(groups); j++ {
						ii = append(ii, j)
					}

					return user, ii
				}

				ii = append(ii, i)
				break
			}
		}
	}

	return user, ii
}
