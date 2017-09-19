package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

type UpdateResultRow struct {
	Ok      bool
	Message string
}

type UpdateResult struct {
	Ok         bool
	Message    string
	RowsResult []UpdateResultRow
}

func serveUpdate(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if !authOk(req) {
		updateResult := UpdateResult{Ok: false, Message: "auth required!"}
		json.NewEncoder(w).Encode(updateResult)
		return
	}

	sqls := strings.TrimSpace(req.FormValue("sqls"))
	tid := strings.TrimSpace(req.FormValue("tid"))

	dataSource, _, err := selectDb(tid, req)
	if err != nil {
		updateResult := UpdateResult{Ok: false, Message: err.Error()}
		json.NewEncoder(w).Encode(updateResult)
		return
	}

	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		updateResult := UpdateResult{Ok: false, Message: err.Error()}
		json.NewEncoder(w).Encode(updateResult)
		return
	}
	defer db.Close()

	resultRows := make([]UpdateResultRow, 0)
	for _, sql := range strings.Split(sqls, ";\n") {
		_, _, rowsAffected, err := update(db, sql)
		if err != nil {
			resultRows = append(resultRows, UpdateResultRow{Ok: false, Message: err.Error()})
		} else if rowsAffected == 1 {
			resultRows = append(resultRows, UpdateResultRow{Ok: true, Message: "1 rows affected!"})
		} else {
			resultRows = append(resultRows, UpdateResultRow{Ok: false, Message: strconv.FormatInt(rowsAffected, 10) + " rows affected!"})
		}
	}

	updateResult := UpdateResult{Ok: true, Message: "Ok", RowsResult: resultRows}
	json.NewEncoder(w).Encode(updateResult)
}
