package main

import (
	"database/sql"
	"encoding/json"
	"github.com/bingoohuang/go-utils"
	"net/http"
	"strconv"
	"strings"
	"time"
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
	Tid              string
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

	_, rows, executionTime, costTime, err, msg := processSql(querySql, dbDataSource)

	queryResult := struct {
		Rows          [][]string
		Error         string
		ExecutionTime string
		CostTime      string
		DatabaseName  string
		Msg           string
	}{
		Rows:          rows,
		Error:         go_utils.Error(err),
		ExecutionTime: executionTime,
		CostTime:      costTime,
		DatabaseName:  databaseName,
		Msg:           msg,
	}

	json.NewEncoder(w).Encode(queryResult)
}

func multipleTenantsQuery(w http.ResponseWriter, req *http.Request) {
	start := time.Now()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if !authOk(req) {
		results := make([]*QueryResult, 1)
		results[0] = &QueryResult{Headers: nil, Rows: nil,
			Error:         "dangerous sql, please get authorized first!",
			ExecutionTime: start.Format("2006-01-02 15:04:05.000"),
			CostTime:      time.Since(start).String(),
		}

		json.NewEncoder(w).Encode(results)
		return
	}

	sqlString := strings.TrimFunc(req.FormValue("sql"), func(r rune) bool {
		return unicode.IsSpace(r) || r == ';'
	})
	multipleTenantIds := strings.FieldsFunc(req.FormValue("multipleTenantIds"), func(c rune) bool { return c == ',' })

	tenantsSize := len(multipleTenantIds)
	resultChan := make(chan *QueryResult, tenantsSize)
	saveHistory(sqlString)

	for _, tid := range multipleTenantIds {
		go executeSqlInTid(tid, resultChan, sqlString)
	}

	results := make([]*QueryResult, tenantsSize)
	for i := 0; i < tenantsSize; i++ {
		results[i] = <-resultChan
	}

	json.NewEncoder(w).Encode(results)
}

func executeSqlInTid(tid string, resultChan chan *QueryResult, sqlString string) {
	dbDataSource, databaseName, err := selectDbByTid(tid, dataSource)
	if err != nil {
		resultChan <- &QueryResult{
			Error: go_utils.Error(err),
			Tid:   tid,
		}
		return
	}

	db, err := sql.Open("mysql", dbDataSource)
	if err != nil {
		resultChan <- &QueryResult{
			Error:        go_utils.Error(err),
			DatabaseName: databaseName,
			Tid:          tid,
		}

		return
	}
	defer db.Close()

	executionTime := time.Now().Format("2006-01-02 15:04:05.000")

	sqls := go_utils.SplitSqls(sqlString, ';')
	sqlsLen := len(sqls)

	if sqlsLen == 1 {
		sqlResult := go_utils.ExecuteSql(db, sqls[0], 0)
		msg := ""
		if !sqlResult.IsQuerySql {
			msg = strconv.FormatInt(sqlResult.RowsAffected, 10) + " rows were affected"
		}
		result := QueryResult{
			Headers:       sqlResult.Headers,
			Rows:          sqlResult.Rows,
			Error:         go_utils.Error(sqlResult.Error),
			ExecutionTime: executionTime,
			CostTime:      sqlResult.CostTime.String(),
			DatabaseName:  databaseName,
			Tid:           tid,
			Msg:           msg,
		}
		resultChan <- &result

		return
	}

	querySqlMixed := false
	if sqlsLen > 1 {
		for _, oneSql := range sqls {
			if go_utils.IsQuerySql(oneSql) {
				querySqlMixed = true
				break
			}
		}
	}

	if querySqlMixed {
		resultChan <- &QueryResult{
			Error:        "select sql should be executed one by one in single time",
			DatabaseName: databaseName,
			Tid:          tid,
		}

		return
	}

	start := time.Now()
	msg := ""
	for _, oneSql := range sqls {
		sqlResult := go_utils.ExecuteSql(db, oneSql, 0)
		if msg != "" {
			msg += "\n"
		}
		if sqlResult.Error != nil {
			msg += sqlResult.Error.Error()
		} else {
			msg += strconv.FormatInt(sqlResult.RowsAffected, 10) + " rows affected"
		}
	}

	resultChan <- &QueryResult{
		ExecutionTime: executionTime,
		CostTime:      time.Since(start).String(),
		DatabaseName:  databaseName,
		Msg:           msg,
		Tid:           tid,
	}
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

	_, tableName, primaryKeys, sqlAllowed := parseSql(w, req, querySql, dbDataSource)
	if !sqlAllowed {
		return
	}

	headers, rows, executionTime, costTime, err, msg := processSql(querySql, dbDataSource)
	primaryKeysIndex := findPrimaryKeysIndex(tableName, primaryKeys, headers)

	queryResult := QueryResult{
		Headers:          headers,
		Rows:             rows,
		Error:            go_utils.Error(err),
		ExecutionTime:    executionTime,
		CostTime:         costTime,
		DatabaseName:     databaseName,
		TableName:        tableName,
		PrimaryKeysIndex: primaryKeysIndex,
		Msg:              msg,
	}

	json.NewEncoder(w).Encode(queryResult)
}

func processSql(querySql, dbDataSource string) ([]string, [][]string, string, string, error, string) {
	isShowHistory := strings.EqualFold("show history", querySql)
	if isShowHistory {
		return showHistory()
	} else {
		saveHistory(querySql)
		return executeQuery(querySql, dbDataSource)
	}
}
