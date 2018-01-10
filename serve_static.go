package main

import (
	"bytes"
	"github.com/gorilla/mux"
	"io"
	"mime"
	"net/http"
	"path/filepath"
)

func serveFont(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	extension := vars["extension"]

	HandleStaticResource("res/iconfont."+extension, w)
}

func serveFavicon(w http.ResponseWriter, r *http.Request) {
	HandleStaticResource("res/favicon.ico", w)
}

func HandleStaticResource(path string, w http.ResponseWriter) {
	data := MustAsset(path)
	fi, _ := AssetInfo(path)
	buffer := bytes.NewReader(data)
	w.Header().Set("Content-Type", detectContentType(fi.Name()))
	w.Header().Set("Last-Modified", fi.ModTime().UTC().Format(http.TimeFormat))
	w.WriteHeader(http.StatusOK)
	io.Copy(w, buffer)
}

func detectContentType(name string) (t string) {
	if t = mime.TypeByExtension(filepath.Ext(name)); t == "" {
		t = "application/octet-stream"
	}
	return
}
