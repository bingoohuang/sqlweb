package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

const linksConfigFile = "linksConfig.toml"

func serveSaveLinksConfig(w http.ResponseWriter, r *http.Request) {
	linksConfig := r.FormValue("linksConfig")
	activeClassifier := r.FormValue("activeClassifier")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	configFile := aclassifiedLinksConfigFile(activeClassifier)
	err := ioutil.WriteFile(configFile, []byte(linksConfig), 0644)
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
		jsonBytes, err := tomlToJson([]byte(linksConfig))
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

func aclassifiedLinksConfigFile(activeClassifier string) string {
	return activeClassifier + "-" + linksConfigFile
}

func serveLoadLinksConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	activeClassifier := r.FormValue("activeClassifier")
	configFile := aclassifiedLinksConfigFile(activeClassifier)
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		json.NewEncoder(w).Encode(struct {
			LinksConfig string
			Json        string
		}{
			LinksConfig: "",
			Json:        "{}",
		})
		return
	}

	linksConfig, _ := ioutil.ReadFile(configFile)
	jsonBytes, err := tomlToJson([]byte(linksConfig))
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
