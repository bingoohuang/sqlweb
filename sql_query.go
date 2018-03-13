package main

import (
	"database/sql"
	"errors"
	"log"
	"strconv"
	"time"

	"github.com/bingoohuang/go-utils"
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
	queryDbSql := "SELECT DB_USERNAME, DB_PASSWORD, PROXY_IP, PROXY_PORT, DB_NAME FROM TR_F_DB WHERE MERCHANT_ID = '" + tid + "' AND STATE = '2'"

	_, data, _, _, err, _ := executeQuery(queryDbSql, ds)
	if err != nil {
		return "", "", err
	}

	if len(data) == 0 {
		return "", "", errors.New("no db found for tid:" + tid)
	} else if len(data) > 1 {
		log.Println("data", data)
		return "", "", errors.New("more than one db found")
	}

	row := data[0]

	// user:pass@tcp(127.0.0.1:3306)/db?charset=utf8
	return row[1] + ":" + row[2] + "@tcp(" + row[3] + ":" + row[4] + ")/" + row[5] + "?charset=utf8mb4,utf8&timeout=3s", row[5], nil
}

func executeQuery(querySql, dataSource string) (
	[]string /*header*/ , [][]string, /*data*/
	string   /*executionTime*/ , string /*costTime*/ , error, string /* msg */) {
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		return nil, nil, "", "", err, ""
	}
	defer db.Close()

	return query(db, querySql, maxRows)
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

func query(db *sql.DB, query string, maxRows int) ([]string, [][]string, string, string, error, string) {
	executionTime := time.Now().Format("2006-01-02 15:04:05.000")

	sqlResult := go_utils.ExecuteSql(db, query, maxRows)

	data := make([][]string, 0)
	if sqlResult.Rows != nil {
		for index, row := range sqlResult.Rows {
			r := make([]string, len(row)+1)
			r[0] = strconv.Itoa(index + 1)
			for j, cell := range row {
				r[j+1] = cell
			}
			data = append(data, r)
		}
	}

	costTime := sqlResult.CostTime.String()
	return sqlResult.Headers, data, executionTime, costTime, sqlResult.Error, strconv.FormatInt(sqlResult.RowsAffected, 10) + " rows were affected"
}
