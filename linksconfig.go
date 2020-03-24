package sqlweb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/bingoohuang/gou/enc"
	"github.com/bingoohuang/gou/htt"
)

const linksConfigFile = "linksConfig.toml"

func ServeSaveLinksConfig(w http.ResponseWriter, r *http.Request) {
	linksConfig := r.FormValue("linksConfig")

	w.Header().Set("Content-Type", htt.ContentTypeJSON)
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
		jsonBytes, err := enc.TomlToJSON([]byte(linksConfig))
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

func ServeLoadLinksConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)

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
	jsonBytes, err := enc.TomlToJSON(linksConfig)
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
