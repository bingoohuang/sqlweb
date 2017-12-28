package main

import (
	"io/ioutil"
	"net/http"
	"os"
)

const linksConfigFile = "linksConfig.toml"

func serveSaveLinksConfig(w http.ResponseWriter, r *http.Request) {
	linksConfig := r.FormValue("linksConfig")

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	err := ioutil.WriteFile(linksConfigFile, []byte(linksConfig), 0644)
	if err != nil {
		w.Write([]byte(err.Error()))
	} else {
		w.Write([]byte("OK"))
	}
}

func serveLoadLinksConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")

	if _, err := os.Stat(linksConfigFile); os.IsNotExist(err) {
		return
	}

	linksConfig, _ := ioutil.ReadFile(linksConfigFile)
	w.Write(linksConfig)
}
