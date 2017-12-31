package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"unicode"
)

type QueryResult struct {
	Headers          []string
	Rows             [][]string
	Error            string
	ExecutionTime    string
	CostTime         string
	DatabaseName     string
	TableName        string
	PrimaryKeysIndex []int
	Msg              string
}

func serveTablesByColumn(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	tid := strings.TrimSpace(req.FormValue("tid"))
	columnName := strings.TrimSpace(req.FormValue("columnName"))

	dbDataSource, databaseName, err := selectDb(tid, req)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	querySql := "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
		"WHERE TABLE_SCHEMA NOT IN('information_schema','mysql','performance_schema') " +
		"AND COLUMN_NAME = '" + columnName + "'"

	_, rows, executionTime, costTime, err, msg := processSql(true, querySql, dbDataSource)

	queryResult := struct {
		Rows          [][]string
		Error         string
		ExecutionTime string
		CostTime      string
		DatabaseName  string
		Msg           string
	}{
		Rows:          rows,
		Error:         gotErrorMessage(err),
		ExecutionTime: executionTime,
		CostTime:      costTime,
		DatabaseName:  databaseName,
		Msg:           msg,
	}

	json.NewEncoder(w).Encode(queryResult)
}

func serveQuery(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	querySql := strings.TrimFunc(req.FormValue("sql"), func(r rune) bool {
		return unicode.IsSpace(r) || r == ';'
	})
	tid := strings.TrimSpace(req.FormValue("tid"))

	dbDataSource, databaseName, err := selectDb(tid, req)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	isSelect, tableName, primaryKeys, sqlAllowed := parseSql(w, req, querySql, dbDataSource)
	if !sqlAllowed {
		return
	}

	headers, rows, executionTime, costTime, err, msg := processSql(isSelect, querySql, dbDataSource)
	primaryKeysIndex := findPrimaryKeysIndex(tableName, primaryKeys, headers)

	queryResult := QueryResult{
		Headers:          headers,
		Rows:             rows,
		Error:            gotErrorMessage(err),
		ExecutionTime:    executionTime,
		CostTime:         costTime,
		DatabaseName:     databaseName,
		TableName:        tableName,
		PrimaryKeysIndex: primaryKeysIndex,
		Msg:              msg,
	}

	json.NewEncoder(w).Encode(queryResult)
}

func processSql(isSelect bool, querySql, dbDataSource string) ([]string, [][]string, string, string, error, string) {
	isShowHistory := strings.EqualFold("show history", querySql)
	if isShowHistory {
		return showHistory()
	} else {
		saveHistory(querySql)
		return executeQuery(isSelect, querySql, dbDataSource)
	}
}

func gotErrorMessage(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}
