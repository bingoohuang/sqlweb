package main

import (
	"bytes"
	"io"
	"mime"
	"net/http"
	"path/filepath"
)

func serveFavicon(w http.ResponseWriter, r *http.Request) {
	path := "res/favicon.ico"
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
