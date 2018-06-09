package main

import (
	"bytes"
	"github.com/bingoohuang/go-utils"
	"github.com/gorilla/mux"
	"io"
	"net/http"
)

func serveFont(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	extension := vars["extension"]

	HandleStaticResource("res/iconfont."+extension, w)
}

func HandleStaticResource(path string, w http.ResponseWriter) {
	data := MustAsset(path)
	fi, _ := AssetInfo(path)
	buffer := bytes.NewReader(data)
	w.Header().Set("Content-Type", go_utils.DetectContentType(fi.Name()))
	w.Header().Set("Last-Modified", fi.ModTime().UTC().Format(http.TimeFormat))
	w.WriteHeader(http.StatusOK)
	io.Copy(w, buffer)
}
