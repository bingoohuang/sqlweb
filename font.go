package main

import (
	"github.com/bingoohuang/gou"
	"github.com/gorilla/mux"
	"net/http"
)

func serveFont(prefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := prefix + mux.Vars(r)["extension"]
		gou.ServeFavicon(path, MustAsset, AssetInfo)(w, r)
	}
}
