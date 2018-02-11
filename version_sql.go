package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type VersionSql struct {
	VersionName string
	SqlSeq      float64
	SqlAppliyer string
	Sqls        string
	State       int64
	CreateTime  string
	UpdateTime  string
}

type ListVersionSqlResponse struct {
	Ok          string
	VersionSqls []VersionSql
}

func serveListVersionSqls(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	versionName := strings.TrimSpace(req.FormValue("versionName"))

	versionSqls, err := ListVersionSqls(versionName)
	res := ListVersionSqlResponse{
		VersionSqls: versionSqls,
	}
	if err != nil {
		res.Ok = err.Error()
	}

	json.NewEncoder(w).Encode(res)
}

func ListVersionSqls(versionName string) ([]VersionSql, error) {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	versionSqls := make([]VersionSql, 0)

	sqlStmt := `select sql_seq, sql_appliyer, sqls, state, create_time, update_time 
				from version_sql where version_name = ? order by sql_seq`
	rows, err := db.Query(sqlStmt, versionName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		vs := VersionSql{
			VersionName: versionName,
		}
		err = rows.Scan(&vs.SqlSeq, &vs.SqlAppliyer, &vs.Sqls, &vs.State, &vs.CreateTime, &vs.UpdateTime)
		if err != nil {
			return nil, err
		}

		versionSqls = append(versionSqls, vs)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return versionSqls, nil
}

func serveAddVersionSql(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	versionName := strings.TrimSpace(req.FormValue("versionName"))
	sqlSeqStr := strings.TrimSpace(req.FormValue("sqlSeq"))
	sqlAppliyer := strings.TrimSpace(req.FormValue("sqlAppliyer"))
	sqls := strings.TrimSpace(req.FormValue("sqls"))

	sqlSeq, _ := strconv.ParseFloat(sqlSeqStr, 64)
	err := AddVersionSql(VersionSql{
		VersionName: versionName,
		SqlSeq:      sqlSeq,
		SqlAppliyer: sqlAppliyer,
		Sqls:        sqls,
	})
	var res SimpleResponse
	if err != nil {
		res.Ok = err.Error()
	}

	json.NewEncoder(w).Encode(res)
}

func AddVersionSql(vs VersionSql) error {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`insert into version_sql(version_name, sql_seq, sql_appliyer, sqls, 
									state, create_time, update_time) values(?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	vs.State = 1
	vs.CreateTime = time.Now().Format(`006-01-02 15:04:05`)
	vs.UpdateTime = vs.CreateTime

	_, err = stmt.Exec(vs.VersionName, vs.SqlSeq, vs.SqlAppliyer, vs.Sqls, vs.State, vs.CreateTime, vs.UpdateTime)
	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Commit()
	return err
}

func serveUpdateVersionSql(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	versionName := strings.TrimSpace(req.FormValue("versionName"))
	oldSqlSeqStr := strings.TrimSpace(req.FormValue("oldSqlSeq"))
	sqlSeqStr := strings.TrimSpace(req.FormValue("sqlSeq"))
	sqlAppliyer := strings.TrimSpace(req.FormValue("sqlAppliyer"))
	sqls := strings.TrimSpace(req.FormValue("sqls"))
	state, _ := strconv.ParseInt(req.FormValue("state"), 10, 8)

	sqlSeq, _ := strconv.ParseFloat(sqlSeqStr, 64)
	oldSqlSeq, _ := strconv.ParseFloat(oldSqlSeqStr, 64)
	rowsAffected, err := UpdateVersionSql(oldSqlSeq, VersionSql{
		VersionName: versionName,
		SqlSeq:      sqlSeq,
		SqlAppliyer: sqlAppliyer,
		Sqls:        sqls,
		State:       state,
	})
	res := UpdateResponse{
		RowsAffected: rowsAffected,
	}
	if err != nil {
		res.Ok = err.Error()
	}

	json.NewEncoder(w).Encode(res)
}

func UpdateVersionSql(oldSqlSeq float64, vs VersionSql) (int64, error) {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return 0, err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	stmt, err := tx.Prepare(`update version_sql set sql_seq = ?, sql_appliyer = ?, 
								sqls = ?, state = ?, update_time = ? where version_name = ? and sql_seq = ? `)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()

	vs.UpdateTime = time.Now().Format(`006-01-02 15:04:05`)
	result, err := stmt.Exec(vs.SqlSeq, vs.SqlAppliyer, vs.Sqls, vs.State, vs.UpdateTime, vs.VersionName, oldSqlSeq)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	rowsAffected, _ := result.RowsAffected()
	err = tx.Commit()
	return rowsAffected, err
}

func serveDeleteVersionSql(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	versionName := strings.TrimSpace(req.FormValue("versionName"))
	sqlSeqStr := strings.TrimSpace(req.FormValue("sqlSeq"))

	sqlSeq, _ := strconv.ParseFloat(sqlSeqStr, 64)
	rowsAffected, err := DeleteVersionSql(VersionSql{
		VersionName: versionName,
		SqlSeq:      sqlSeq,
	})

	res := UpdateResponse{
		RowsAffected: rowsAffected,
	}
	if err != nil {
		res.Ok = err.Error()
	}

	json.NewEncoder(w).Encode(res)
}

func DeleteVersionSql(vs VersionSql) (int64, error) {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return 0, err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	stmt, err := tx.Prepare(`delete from version_sql where version_name = ? and sql_seq = ? `)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()

	result, err := stmt.Exec(vs.VersionName, vs.SqlSeq)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	rowsAffected, _ := result.RowsAffected()

	err = tx.Commit()
	return rowsAffected, err
}
