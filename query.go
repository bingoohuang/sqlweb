package sqlweb

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/bingoohuang/gg/pkg/man"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/bingoohuang/gou/htt"
	"github.com/bingoohuang/gou/str"
	"github.com/bingoohuang/sqlx"
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
	CreateSth        bool
}

func ServeTablesByColumn(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	tid := strings.TrimSpace(req.FormValue("tid"))
	columnName := strings.TrimSpace(req.FormValue("columnName"))

	ds, db, err := selectDb(req, tid, true)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	q := "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
		"WHERE TABLE_SCHEMA NOT IN('information_schema','mysql','performance_schema') " +
		"AND COLUMN_NAME = '" + columnName + "'"
	_, rows, executionTime, costTime, err, msg := processSql(q, ds, 0)

	queryResult := struct {
		Rows          [][]string
		Error         string
		ExecutionTime string
		CostTime      string
		DatabaseName  string
		Msg           string
	}{
		Rows:          rows,
		Error:         str.Error(err),
		ExecutionTime: executionTime,
		CostTime:      costTime,
		DatabaseName:  db,
		Msg:           msg,
	}

	json.NewEncoder(w).Encode(queryResult)
}

func TenantsQuery(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	sqlString := strings.TrimFunc(r.FormValue("sql"), func(r rune) bool {
		return unicode.IsSpace(r) || r == ';'
	})

	for _, q := range sqlx.SplitSqls(sqlString, ';') {
		if _, yes := sqlx.IsQuerySQL(q); yes {
			continue
		}

		if !writeAuthOk(r) {
			http.Error(w, "write auth required", 405)
			return
		}
	}

	tids := r.FormValue("multipleTenantIds")
	multipleTenantIds := strings.FieldsFunc(tids, func(c rune) bool { return c == ',' })

	tenantsSize := len(multipleTenantIds)
	resultChan := make(chan *QueryResult, tenantsSize)

	for _, tid := range multipleTenantIds {
		go executeSqlInTid(tid, resultChan, sqlString)
	}

	results := make([]*QueryResult, tenantsSize)
	for i := 0; i < tenantsSize; i++ {
		results[i] = <-resultChan
	}

	json.NewEncoder(w).Encode(results)
}

func executeSqlInTid(tid string, resultChan chan *QueryResult, query string) {
	dbDataSource, databaseName, err := selectDbByTid(tid, AppConf.DSN)
	if err != nil {
		resultChan <- &QueryResult{Error: str.Error(err), Tid: tid}
		return
	}

	db, err := sql.Open("mysql", dbDataSource)
	if err != nil {
		resultChan <- &QueryResult{Error: str.Error(err), DatabaseName: databaseName, Tid: tid}

		return
	}
	defer db.Close()

	executionTime := time.Now().Format("2006-01-02 15:04:05.000")

	sqls := sqlx.SplitSqls(query, ';')
	if len(sqls) == 1 {
		sqlResult := sqlx.ExecSQL(db, sqls[0], 0, "(null)")
		msg := ""
		if !sqlResult.IsQuerySQL {
			msg = strconv.FormatInt(sqlResult.RowsAffected, 10) + " rows were affected"
		}
		result := QueryResult{
			Headers:       sqlResult.Headers,
			Rows:          sqlResult.Rows,
			Error:         str.Error(sqlResult.Error),
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
	if len(sqls) > 1 {
		for _, oneSql := range sqls {
			if _, yes := sqlx.IsQuerySQL(oneSql); yes {
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
		sqlResult := sqlx.ExecSQL(db, oneSql, 0, "(null)")
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

func DownloadColumn(w http.ResponseWriter, req *http.Request) {
	querySql := strings.TrimFunc(req.FormValue("sql"), func(r rune) bool {
		return unicode.IsSpace(r) || r == ';'
	})
	fileName := strings.TrimSpace(req.FormValue("fileName"))
	tid := strings.TrimSpace(req.FormValue("tid"))

	ds, _, err := selectDb(req, tid, false)
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

func ServeQuery(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	query := strings.TrimFunc(req.FormValue("sql"), func(r rune) bool { return unicode.IsSpace(r) || r == ';' })
	if _, yes := sqlx.IsQuerySQL(query); yes && !writeAuthOk(req) {
		http.Error(w, "write auth required", 405)
		return
	}

	maxRows := 0
	if maxRowsStr := strings.TrimSpace(req.FormValue("maxRows")); maxRowsStr != "" {
		maxRows, _ = strconv.Atoi(maxRowsStr)
	}

	if maxRows < AppConf.MaxQueryRows {
		maxRows = AppConf.MaxQueryRows
	}

	ds, db, err := selectDb(req, strings.TrimSpace(req.FormValue("tid")), true)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	tableName, pks, createSth := parseSql(query, ds)
	headers, rows, execTime, costTime, err, msg := processSql(query, ds, maxRows)
	primaryKeysIndex := findPrimaryKeysIndex(tableName, pks, headers)

	queryResult := QueryResult{
		Headers:          headers,
		Rows:             rows,
		Error:            str.Error(err),
		ExecutionTime:    execTime,
		CostTime:         costTime,
		DatabaseName:     db,
		TableName:        tableName,
		PrimaryKeysIndex: primaryKeysIndex,
		Msg:              msg,
		CreateSth:        createSth,
	}

	if "true" == strings.TrimSpace(req.FormValue("withColumns")) {
		tableColumns := make(map[string][]string)
		columnsSql := `select TABLE_NAME, COLUMN_NAME, COLUMN_COMMENT, COLUMN_KEY, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
			from INFORMATION_SCHEMA.COLUMNS
			where TABLE_SCHEMA = '` + db + `' order by TABLE_NAME`
		_, colRows, _, _, _, _ := processSql(columnsSql, ds, 0)

		tableName := ""
		var columns []string

		for _, r := range colRows {
			if tableName != r[1] {
				if tableName != "" {
					tableColumns[tableName] = columns
					columns = make([]string, 0)
				}
				tableName = r[1]
			}

			columns = append(columns, r[2], r[3], r[4], r[5], r[6], r[7])
		}

		if tableName != "" {
			tableColumns[tableName] = columns
		}

		tComment := `select TABLE_NAME, TABLE_COMMENT,TABLE_ROWS, DATA_LENGTH+INDEX_LENGTH from INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA = '` + db + `'`
		_, rows, _, _, _, _ := processSql(tComment, ds, 0)
		for _, row := range rows {
			tblName := row[1]
			if _, ok := tableColumns[tblName]; ok {
				tableColumns[tblName+`_TABLE_COMMENT`] = []string{row[2]}
				tableRows := row[3]
				if tableRows == "(null)" {
					tableRows = "0"
				}
				tableColumns[tblName+`_TABLE_ROWS`] = []string{tableRows}
				length, _ := strconv.Atoi(row[4])
				iBytes := man.IBytes(uint64(length))
				iBytes = strings.TrimRightFunc(iBytes, func(r rune) bool { return r == 'B' || r == 'i' })
				tableColumns[tblName+`_TABLE_LENGTH`] = []string{iBytes}
			}
		}

		queryResult.TableColumns = tableColumns
	}

	_ = json.NewEncoder(w).Encode(queryResult)
}

func processSql(querySql, dbDataSource string, max int) ([]string, [][]string, string, string, error, string) {
	return executeQuery(querySql, dbDataSource, max)
}
