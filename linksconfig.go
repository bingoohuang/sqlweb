package main

import (
	"encoding/json"
	"fmt"
	"github.com/bingoohuang/gou"
	"io/ioutil"
	"net/http"
	"os"
)

const linksConfigFile = "linksConfig.toml"

func serveSaveLinksConfig(w http.ResponseWriter, r *http.Request) {
	linksConfig := r.FormValue("linksConfig")

	gou.HeadContentTypeJson(w)
	err := ioutil.WriteFile(linksConfigFile, []byte(linksConfig), 0644)
	if err != nil {
		_ = json.NewEncoder(w).Encode(struct {
			OK   string
			Json string
		}{
			OK:   err.Error(),
			Json: "{}",
		})
		_, _ = w.Write([]byte(err.Error()))
	} else {
		jsonBytes, err := gou.TomlToJson([]byte(linksConfig))
		ok := "OK"
		if err != nil {
			ok = err.Error()
		}
		_ = json.NewEncoder(w).Encode(struct {
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
	gou.HeadContentTypeJson(w)

	if _, err := os.Stat(linksConfigFile); os.IsNotExist(err) {
		_ = json.NewEncoder(w).Encode(struct {
			LinksConfig string
			Json        string
		}{
			LinksConfig: "",
			Json:        "{}",
		})
		return
	}

	linksConfig, _ := ioutil.ReadFile(linksConfigFile)
	jsonBytes, err := gou.TomlToJson([]byte(linksConfig))
	if err != nil {
		fmt.Println("tomlToJson err:", err.Error())
	}

	_ = json.NewEncoder(w).Encode(struct {
		LinksConfig string
		Json        string
	}{
		LinksConfig: string(linksConfig),
		Json:        string(jsonBytes),
	})
}
