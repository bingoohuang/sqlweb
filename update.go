package sqlweb

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/bingoohuang/gou/htt"
	"github.com/bingoohuang/sqlx"
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

func ServeUpdate(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)

	if !writeAuthOk(r) {
		http.Error(w, "write auth required", 405)
		return
	}

	sqls := strings.TrimSpace(r.FormValue("sqls"))
	tid := strings.TrimSpace(r.FormValue("tid"))

	dataSource, _, err := selectDb(tid)
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
	for _, s := range strings.Split(sqls, ";\n") {
		sqlResult := sqlx.ExecSQL(db, s, 0, "(null)")
		if sqlResult.Error != nil {
			resultRows = append(resultRows, UpdateResultRow{Ok: false, Message: sqlResult.Error.Error()})
		} else if sqlResult.RowsAffected == 1 {
			resultRows = append(resultRows, UpdateResultRow{Ok: true, Message: "1 rows affected!"})
		} else {
			resultRows = append(resultRows, UpdateResultRow{Ok: false, Message: strconv.FormatInt(sqlResult.RowsAffected, 10) + " rows affected!"})
		}
	}

	updateResult := UpdateResult{Ok: true, Message: "Ok", RowsResult: resultRows}
	json.NewEncoder(w).Encode(updateResult)
}
