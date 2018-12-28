package main

import (
	"github.com/bingoohuang/go-utils"
	"github.com/gorilla/mux"
	"net/http"
)


func serveFont(prefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := prefix + mux.Vars(r)["extension"]
		go_utils.ServeFavicon(path, MustAsset, AssetInfo)(w, r)
	}
}
