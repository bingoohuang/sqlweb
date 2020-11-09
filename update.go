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

func WrapHandlerFunc(f func(http.ResponseWriter, *http.Request) (interface{}, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if result, err := f(w, r); err != nil {
			_ = json.NewEncoder(w).Encode(UpdateResult{Ok: false, Message: err.Error()})
		} else if result != nil {
			_ = json.NewEncoder(w).Encode(result)
		}
	}
}

func ServeUpdate(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)

	if !writeAuthOk(r) {
		http.Error(w, "write auth required", 405)
		return nil, nil
	}

	sqls := strings.TrimSpace(r.FormValue("sqls"))
	tid := strings.TrimSpace(r.FormValue("tid"))

	dataSource, _, err := selectDb(tid)
	if err != nil {
		return nil, err
	}

	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	resultRows := make([]UpdateResultRow, 0)
	for _, s := range strings.Split(sqls, ";\n") {
		sqlResult := sqlx.ExecSQL(db, s, 0, "(null)")
		if sqlResult.Error != nil {
			resultRows = append(resultRows,
				UpdateResultRow{Ok: false, Message: sqlResult.Error.Error()})
		} else if sqlResult.RowsAffected == 1 {
			resultRows = append(resultRows,
				UpdateResultRow{Ok: true, Message: "1 rows affected!"})
		} else {
			message := strconv.FormatInt(sqlResult.RowsAffected, 10) + " rows affected!"
			resultRows = append(resultRows,
				UpdateResultRow{Ok: false, Message: message})
		}
	}

	return UpdateResult{Ok: true, Message: "Ok", RowsResult: resultRows}, nil
}
