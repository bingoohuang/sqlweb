package main

import (
	"flag"
	"github.com/bingoohuang/go-utils"
	"strconv"
	"strings"
)

var (
	contextPath string
	port        string
	maxRows     int
	gDatasource string

	devMode      bool // to disable css/js minify
	authBasic    bool
	multiTenants bool
	importDb     bool

	northProxy string
	southProxy string

	defaultTenant string
)

var authParam go_utils.MustAuthParam

func init() {
	contextPathArg := flag.String("contextPath", "", "context path")
	portArg := flag.Int("port", 8381, "Port to serve.")
	flag.IntVar(&maxRows, "maxRows", 1000, "Max number of rows to return.")
	flag.StringVar(&gDatasource, "dataSource", "user:pass@tcp(127.0.0.1:3306)/?charset=utf8", "dataSource string.")

	go_utils.PrepareMustAuthFlag(&authParam)

	flag.BoolVar(&importDb, "importDb", false, "importDb allowed or not")
	flag.BoolVar(&devMode, "devMode", false, "devMode(disable js/css minify)")
	flag.BoolVar(&authBasic, "authBasic", false, "authBasic based on poems")
	flag.BoolVar(&multiTenants, "multiTenants", false, "support multiTenants")
	flag.StringVar(&defaultTenant, "defaultTenant", "", "default tenant")

	flag.StringVar(&northProxy, "northProxy", "http://127.0.0.1:8092", "northProxy")
	flag.StringVar(&southProxy, "southProxy", "http://127.0.0.1:8082", "southProxy")

	flag.Parse()

	contextPath = *contextPathArg
	if contextPath != "" && strings.Index(contextPath, "/") < 0 {
		contextPath = "/" + contextPath
	}

	port = strconv.Itoa(*portArg)
}
