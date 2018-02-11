package main

import (
	"database/sql"
	"errors"
	"log"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"net/http"
)

func selectDb(tid string, req *http.Request) (string, string, error) {
	if tid == "trr" {
		if authOk(req) {
			return dataSource, "", nil
		}
	}

	return selectDbByTid(tid, dataSource)
}

func selectDbByTid(tid string, ds string) (string, string, error) {
	queryDbSql := "SELECT DB_USERNAME, DB_PASSWORD, PROXY_IP, PROXY_PORT, DB_NAME FROM TR_F_DB WHERE MERCHANT_ID = '" + tid + "'"

	_, data, _, _, err, _ := executeQuery(true, queryDbSql, ds)
	if err != nil {
		return "", "", err
	}

	if len(data) == 0 {
		return "", "", errors.New("no db found")
	} else if len(data) > 1 {
		return "", "", errors.New("more than one db found")
	}

	row := data[0]

	// user:pass@tcp(127.0.0.1:3306)/db?charset=utf8
	return row[1] + ":" + row[2] + "@tcp(" + row[3] + ":" + row[4] + ")/" + row[5] + "?charset=utf8mb4,utf8&timeout=3s", row[5], nil
}

func executeQuery(isSelect bool, querySql, dataSource string) (
	[]string /*header*/, [][]string, /*data*/
	string /*executionTime*/, string /*costTime*/, error, string /* msg */) {
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		return nil, nil, "", "", err, ""
	}
	defer db.Close()

	header, data, executionTime, costTime, err, msg := query(isSelect, db, querySql, maxRows)
	return header, data, executionTime, costTime, err, msg
}

func update(db *sql.DB, sql string) (string, string, int64, error) {
	saveHistory(sql)
	log.Printf("execute sql: %s", sql)
	start := time.Now()
	executionTime := start.Format("2006-01-02 15:04:05.000")
	r, err := db.Exec(sql)

	costTime := time.Since(start).String()
	if err != nil {
		return executionTime, costTime, 0, err
	}

	rowsAffected, err := r.RowsAffected()
	return executionTime, costTime, rowsAffected, err
}

func query(isSelect bool, db *sql.DB, query string, maxRows int) ([]string, [][]string, string, string, error, string) {
	log.Printf("querying: %s", query)
	start := time.Now()
	executionTime := start.Format("2006-01-02 15:04:05.000")

	if !isSelect {
		r, err := db.Exec(query)
		costTime := time.Since(start).String()
		if err != nil {
			return nil, nil, executionTime, costTime, err, ""
		}

		affected, _ := r.RowsAffected()
		return nil, nil, executionTime, costTime, err, strconv.FormatInt(affected, 10) + " rows were affected"
	}

	rows, err := db.Query(query)

	costTime := time.Since(start).String()
	if err != nil {
		return nil, nil, executionTime, costTime, err, ""
	}

	columns, err := rows.Columns()
	if err != nil {
		return nil, nil, executionTime, costTime, err, ""
	}

	columnSize := len(columns)

	data := make([][]string, 0)

	for row := 1; rows.Next() && (maxRows == 0 || row <= maxRows); row++ {
		strValues := make([]sql.NullString, columnSize+1)
		strValues[0] = sql.NullString{String: strconv.Itoa(row), Valid: true}
		pointers := make([]interface{}, columnSize)
		for i := 0; i < columnSize; i++ {
			pointers[i] = &strValues[i+1]
		}
		if err := rows.Scan(pointers...); err != nil {
			return columns, data, executionTime, "", err, ""
		}

		values := make([]string, columnSize+1)
		for i, v := range strValues {
			if v.Valid {
				values[i] = v.String
			} else {
				values[i] = "(null)"
			}
		}

		data = append(data, values)
	}

	costTime = time.Since(start).String()
	return columns, data, executionTime, costTime, nil, ""
}
