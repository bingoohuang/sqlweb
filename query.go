package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"
	"unicode"

	go_utils "github.com/bingoohuang/go-utils"
)

type QueryResult struct {
	Headers          []string
	Rows             [][]string
	TableColumns     map[string][]string
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
	go_utils.HeadContentTypeJson(w)
	tid := strings.TrimSpace(req.FormValue("tid"))
	columnName := strings.TrimSpace(req.FormValue("columnName"))

	dbDataSource, databaseName, err := selectDb(tid)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	querySql := "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
		"WHERE TABLE_SCHEMA NOT IN('information_schema','mysql','performance_schema') " +
		"AND COLUMN_NAME = '" + columnName + "'"

	_, rows, executionTime, costTime, err, msg := processSql(tid, querySql, dbDataSource, 0)

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
	go_utils.HeadContentTypeJson(w)
	sqlString := strings.TrimFunc(req.FormValue("sql"), func(r rune) bool {
		return unicode.IsSpace(r) || r == ';'
	})

	sqls := go_utils.SplitSqls(sqlString, ';')
	for _, sql := range sqls {
		if go_utils.IsQuerySql(sql) {
			continue
		}
		if !writeAuthOk(req) {
			http.Error(w, "write auth required", 405)
			return
		}
	}

	tids := req.FormValue("multipleTenantIds")
	multipleTenantIds := strings.FieldsFunc(tids, func(c rune) bool { return c == ',' })

	tenantsSize := len(multipleTenantIds)
	resultChan := make(chan *QueryResult, tenantsSize)
	saveHistory(tids, sqlString)

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
	dbDataSource, databaseName, err := selectDbByTid(tid, appConfig.DataSource)
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

func downloadColumn(w http.ResponseWriter, req *http.Request) {
	querySql := strings.TrimFunc(req.FormValue("sql"), func(r rune) bool {
		return unicode.IsSpace(r) || r == ';'
	})
	fileName := strings.TrimSpace(req.FormValue("fileName"))
	tid := strings.TrimSpace(req.FormValue("tid"))

	ds, _, err := selectDb(tid)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	db, err := sql.Open("mysql", ds)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}
	defer db.Close()

	rows, err := db.Query(querySql)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}
	columns, err := rows.Columns()
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	columnCount := len(columns)
	if columnCount != 1 {
		http.Error(w, "only one column supported to download", 500)
		return
	}

	if !rows.Next() {
		http.Error(w, "Nothing to download", 500)
		return
	}

	// Make a slice for the values
	values := make([]sql.RawBytes, columnCount)

	// rows.Scan wants '[]interface{}' as an argument, so we must copy the
	// references into such a slice
	// See http://code.google.com/p/go-wiki/wiki/InterfaceSlice for details
	scanArgs := make([]interface{}, columnCount)
	for i := range values {
		scanArgs[i] = &values[i]
	}

	err = rows.Scan(scanArgs...)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	fmt.Println(reflect.TypeOf(values[0]))

	// tell the browser the returned content should be downloaded
	w.Header().Add("Content-Disposition", "Attachment; filename="+fileName)
	http.ServeContent(w, req, fileName, time.Now(), bytes.NewReader([]byte(values[0])))
}

func serveQuery(w http.ResponseWriter, req *http.Request) {
	go_utils.HeadContentTypeJson(w)
	querySql := strings.TrimFunc(req.FormValue("sql"), func(r rune) bool {
		return unicode.IsSpace(r) || r == ';'
	})

	if !go_utils.IsQuerySql(querySql) && !writeAuthOk(req) {
		http.Error(w, "write auth required", 405)
		return
	}

	tid := strings.TrimSpace(req.FormValue("tid"))
	withColumns := strings.TrimSpace(req.FormValue("withColumns"))
	maxRowsStr := strings.TrimSpace(req.FormValue("maxRows"))
	maxRows := 0
	if maxRowsStr != "" {
		maxRows, _ = strconv.Atoi(maxRowsStr)
	}

	if maxRows < appConfig.MaxQueryRows {
		maxRows = appConfig.MaxQueryRows
	}

	ds, dbName, err := selectDb(tid)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	tableName, primaryKeys := parseSql(querySql, ds)
	headers, rows, execTime, costTime, err, msg := processSql(tid, querySql, ds, maxRows)
	primaryKeysIndex := findPrimaryKeysIndex(tableName, primaryKeys, headers)

	queryResult := QueryResult{
		Headers:          headers,
		Rows:             rows,
		Error:            go_utils.Error(err),
		ExecutionTime:    execTime,
		CostTime:         costTime,
		DatabaseName:     dbName,
		TableName:        tableName,
		PrimaryKeysIndex: primaryKeysIndex,
		Msg:              msg,
	}

	if "true" == withColumns {
		tableColumns := make(map[string][]string)
		columnsSql := `select TABLE_NAME, COLUMN_NAME, COLUMN_COMMENT, COLUMN_KEY, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
			from INFORMATION_SCHEMA.COLUMNS
			where TABLE_SCHEMA = '` + dbName + `' order by TABLE_NAME`
		_, colRows, _, _, _, _ := processSql(tid, columnsSql, ds, 0)

		tableName := ""
		var columns []string

		for _, row := range colRows {
			if tableName != row[1] {
				if tableName != "" {
					tableColumns[tableName] = columns
					columns = make([]string, 0)
				}
				tableName = row[1]
			}

			columns = append(columns, row[2], row[3], row[4], row[5], row[6], row[7])
		}

		if tableName != "" {
			tableColumns[tableName] = columns
		}

		tableCommentSql := `select TABLE_NAME, TABLE_COMMENT from INFORMATION_SCHEMA.TABLES ` +
			`where TABLE_SCHEMA = '` + dbName + `'`
		_, tableRows, _, _, _, _ := processSql(tid, tableCommentSql, ds, 0)
		for _, row := range tableRows {
			tblName := row[1]
			_, ok := tableColumns[tblName]
			if ok {
				tableCommentCols := make([]string, 0)
				tableCommentCols = append(tableCommentCols, row[2])
				tableColumns[tblName+`_TABLE_COMMENT`] = tableCommentCols
			}
		}

		queryResult.TableColumns = tableColumns
	}

	_ = json.NewEncoder(w).Encode(queryResult)
}

func processSql(tid, querySql, dbDataSource string, max int) ([]string, [][]string, string, string, error, string) {
	isShowHistory := strings.EqualFold("show history", querySql)
	if isShowHistory {
		return showHistory()
	}

	saveHistory(tid, querySql)
	return executeQuery(querySql, dbDataSource, max)
}
