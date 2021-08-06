package sqlweb

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"

	"github.com/bingoohuang/sqlx"

	_ "github.com/go-sql-driver/mysql"
)

func selectDb(r *http.Request, tid string, databaseNameRequired bool) (string, string, error) {
	cookieValue := r.Context().Value(LoginUserKey)
	var user *LoginUser
	if cookieValue != nil {
		user = cookieValue.(*LoginUser)
	}

	if user != nil && user.Limit2ConfigDSN {
		dbIndex := 0
		if len(user.DSNGroups) == 1 {
			dbIndex = user.DSNGroups[0]
		} else {
			dbName := strings.TrimPrefix(tid, "sdb-")
			for _, dbi := range user.DSNGroups {
				if ds := AppConf.GetDSN(dbi); ds != "" {
					if found, _ := FindDbName(ds); found == dbName {
						return ds, dbName, nil
					}
				}
			}

			dbIndex = user.DefaultDB
		}

		dsn := AppConf.GetDSN(dbIndex)
		dbName, err := FindDbName(dsn)
		return dsn, dbName, err
	}

	if strings.HasPrefix(tid, "sdb-") {
		dsnConfig, err := mysql.ParseDSN(AppConf.DSN)
		if err != nil {
			return "", "", err
		}

		dsnConfig.DBName = strings.TrimPrefix(tid, "sdb-")
		return dsnConfig.FormatDSN(), dsnConfig.DBName, nil
	}

	if tid == "" || tid == "trr" {
		dbName, _ := FindDbName(AppConf.DSN)
		return AppConf.DSN, dbName, nil
	}

	return selectDbByTid(tid, AppConf.DSN)

}

func FindDbName(dsn string) (string, error) {
	dsnConfig, err := mysql.ParseDSN(dsn)
	if err != nil {
		return "", err
	}

	if dsnConfig != nil && dsnConfig.DBName != "" {
		return dsnConfig.DBName, nil
	}

	_, rows, _, _, err, _ := executeQuery("SELECT DATABASE()", dsn, 0)
	if err != nil {
		return "", err
	}
	return rows[0][1], nil
}

func selectDbByTid(tid string, ds string) (string, string, error) {
	queryDbSql := "SELECT DB_USERNAME, DB_PASSWORD, PROXY_IP, PROXY_PORT, DB_NAME " +
		"FROM sqlweb WHERE MERCHANT_ID = '" + tid + "'"

	_, data, _, _, err, _ := executeQuery(queryDbSql, ds, 1)
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
	return row[1] + ":" + row[2] + "@tcp(" + row[3] + ":" + row[4] + ")/" + row[5] +
		"?charset=utf8mb4,utf8&timeout=30s", row[5], nil
}

func executeQuery(querySql, dataSource string, max int) (
	[]string /*header*/, [][]string, /*data*/
	string /*executionTime*/, string /*costTime*/, error, string /* msg */) {
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		return nil, nil, "", "", err, ""
	}
	defer db.Close()

	return query(db, querySql, max)
}

func query(db *sql.DB, query string, maxRows int) ([]string, [][]string, string, string, error, string) {
	executionTime := time.Now().Format("2006-01-02 15:04:05.000")

	sqlResult := sqlx.ExecSQL(db, query, sqlx.ExecOption{MaxRows: maxRows, NullReplace: "(null)"})
	data := addRowsSeq(&sqlResult)

	msg := ""
	if !sqlResult.IsQuerySQL {
		msg = strconv.FormatInt(sqlResult.RowsAffected, 10) + " rows were affected"
	}

	return sqlResult.Headers, data, executionTime, sqlResult.CostTime.String(), sqlResult.Error, msg
}

func addRowsSeq(sqlResult *sqlx.ExecResult) [][]string {
	data := make([][]string, 0)
	if sqlResult.Rows == nil {
		return data
	}

	for index, row := range sqlResult.Rows {
		r := make([]string, len(row)+1)
		r[0] = strconv.Itoa(index + 1)
		for j, cell := range row {
			r[j+1] = cell
		}

		data = append(data, r)
	}

	return data
}
