package main

import (
	"encoding/json"
	"fmt"
	"github.com/bingoohuang/go-utils"
	"io/ioutil"
	"net/http"
	"os"
)

const linksConfigFile = "linksConfig.toml"

func serveSaveLinksConfig(w http.ResponseWriter, r *http.Request) {
	linksConfig := r.FormValue("linksConfig")

	go_utils.HeadContentTypeJson(w)
	err := ioutil.WriteFile(linksConfigFile, []byte(linksConfig), 0644)
	if err != nil {
		json.NewEncoder(w).Encode(struct {
			OK   string
			Json string
		}{
			OK:   err.Error(),
			Json: "{}",
		})
		w.Write([]byte(err.Error()))
	} else {
		jsonBytes, err := go_utils.TomlToJson([]byte(linksConfig))
		ok := "OK"
		if err != nil {
			ok = err.Error()
		}
		json.NewEncoder(w).Encode(struct {
			LinksConfig string
			OK          string
			Json        string
		}{
			OK:   ok,
			Json: string(jsonBytes),
		})
	}
}

func serveLoadLinksConfig(w http.ResponseWriter, r *http.Request) {
	go_utils.HeadContentTypeJson(w)

	if _, err := os.Stat(linksConfigFile); os.IsNotExist(err) {
		json.NewEncoder(w).Encode(struct {
			LinksConfig string
			Json        string
		}{
			LinksConfig: "",
			Json:        "{}",
		})
		return
	}

	linksConfig, _ := ioutil.ReadFile(linksConfigFile)
	jsonBytes, err := go_utils.TomlToJson([]byte(linksConfig))
	if err != nil {
		fmt.Println("tomlToJson err:", err.Error())
	}

	json.NewEncoder(w).Encode(struct {
		LinksConfig string
		Json        string
	}{
		LinksConfig: string(linksConfig),
		Json:        string(jsonBytes),
	})
}
