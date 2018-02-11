package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type VersionSqlSub struct {
	VersionName string
	SqlSeq      float64
	SubSeq      int64
	Sql         string
	CreateTime  string
	UpdateTime  string
}

type Tenant struct {
	Tid   string
	Tname string
}

type VersionRunBean struct {
	VersionName  string
	Tid          string
	Tname        string
	SqlSeq       float64
	SubSeq       int64
	RunTime      string
	CostTime     string
	RunResult    string
	RowsAffected int64
	CreateTime   string
	UpdateTime   string
}

type PrepareExecuteVersionSqlResponse struct {
	Ok           string
	RowsAffected int64
	VersionRuns  []VersionRunBean
}

func servePrepareExecuteVersionSql(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	VersionName := strings.TrimSpace(req.FormValue("VersionName"))
	Tenants := make([]Tenant, 0)
	err := json.Unmarshal([]byte(req.FormValue("Tenants")), &Tenants)

	var res PrepareExecuteVersionSqlResponse
	if err != nil {
		res.Ok = err.Error()
		json.NewEncoder(w).Encode(res)
		return
	}

	beans, err := PrepareRun(VersionName, Tenants)
	if err != nil {
		res.Ok = err.Error()
	} else {
		res.VersionRuns = beans
	}
	json.NewEncoder(w).Encode(res)
}

func PrepareRun(VersionName string, Tenants []Tenant) ([]VersionRunBean, error) {
	versionSqlSubs, err := GetVersionSqlSubs(VersionName)
	if err != nil {
		return nil, err
	}

	err = AddVersionSqlSubs(versionSqlSubs)
	if err != nil {
		return nil, err
	}

	versionRuns := createVersionRuns(versionSqlSubs, Tenants, VersionName)
	return versionRuns, AddVersionRuns(versionRuns)
}

type ExecuteResult struct {
	Tid        string
	Error      string
	SqlResults []SqlResult
}

type SqlResult struct {
	VersionName  string
	SqlSeq       float64
	SubSeq       int64
	Sql          string
	RunTime      string
	CostTime     string
	RunResult    string
	RowsAffected int64
}

func BatchVersionRun(VersionName string, Tids []string) ([]ExecuteResult, error) {
	subs, err := queryVersonSubs(VersionName)
	if err != nil {
		return nil, err
	}

	run := ExecuteVersionRun(subs, Tids)
	updateRun(run)

	return run, nil
}

func ExecuteVersionRun(subs []VersionSqlSub, tenants []string) []ExecuteResult {
	results := make([]ExecuteResult, 0)

	for _, tid := range tenants {
		result := ExecuteResult{
			Tid: tid,
		}

		ds, _, err := selectDbByTid(tid, dataSource)
		if err != nil {
			result.Error = err.Error()
		} else {
			results, err := ExecuteVersionSqls(ds, subs)
			result.SqlResults = results
			if err != nil {
				result.Error = err.Error()
			}
		}

		results = append(results, result)
	}

	return results
}

func ExecuteVersionSqls(ds string, subs []VersionSqlSub) ([]SqlResult, error) {
	results := make([]SqlResult, 0)

	db, err := sql.Open("mysql", ds)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	for _, sub := range subs {
		result := ExecuteSubSql(db, sub)
		results = append(results, *result)
	}

	return results, nil
}

func ExecuteSubSql(db *sql.DB, sub VersionSqlSub) *SqlResult {
	start := time.Now()
	result := SqlResult{
		VersionName: sub.VersionName,
		SqlSeq:      sub.SqlSeq,
		SubSeq:      sub.SubSeq,
		Sql:         sub.Sql,
		RunTime:     start.Format("2006-01-02 15:04:05"),
	}

	res, err := db.Exec(sub.Sql)
	if err != nil {
		result.RunResult = err.Error()
	}
	result.RowsAffected, _ = res.RowsAffected()
	result.CostTime = time.Since(start).String()
	return &result
}

func updateRun(results []ExecuteResult) error {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`update version_run set run_time = ?, cost_time = ?, rows_affected = ?,
		run_result = ? where version_name = ? and tid = ? and sql_seq = ? and sub_seq = ?`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, r := range results {
		for _, x := range r.SqlResults {
			stmt.Exec(x.RunTime, x.CostTime, x.RowsAffected, x.RunResult, x.VersionName, r.Tid, x.SqlSeq, x.SubSeq)
		}
	}

	return nil
}

func queryVersonSubs(VersionName string) ([]VersionSqlSub, error) {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	sqlSubs := make([]VersionSqlSub, 0)

	sqlStmt := `select sql_seq, sub_seq, sql from version_sql_sub order by sql_seq, sub_seq
					where version_name = ?`

	rows, err := db.Query(sqlStmt, VersionName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		sub := VersionSqlSub{
			VersionName: VersionName,
		}
		err = rows.Scan(&sub.SqlSeq, &sub.SubSeq, &sub.Sql)
		if err != nil {
			return nil, err
		}

		sqlSubs = append(sqlSubs, sub)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return sqlSubs, nil
}

func createVersionRuns(subs []VersionSqlSub, tenants []Tenant, VersionName string) []VersionRunBean {
	currentTime := time.Now().Format(`006-01-02 15:04:05`)
	versionRuns := make([]VersionRunBean, 0)
	for _, sub := range subs {
		for _, tenant := range tenants {
			versionRuns = append(versionRuns, VersionRunBean{
				VersionName: VersionName,
				Tid:         tenant.Tid,
				Tname:       tenant.Tname,
				SqlSeq:      sub.SqlSeq,
				SubSeq:      sub.SubSeq,
				CreateTime:  currentTime,
				UpdateTime:  currentTime,
			})
		}
	}
	return versionRuns
}

func GetVersionSqlSubs(VersionName string) ([]VersionSqlSub, error) {
	versionSqls, err := ListVersionSqls(VersionName)
	if err != nil {
		return nil, err
	}

	currentTime := time.Now().Format(`006-01-02 15:04:05`)

	versionSqlSubs := make([]VersionSqlSub, 0)
	for _, versionSql := range versionSqls {
		if versionSql.State != 1 {
			continue
		}

		subsSqls := SplitSubSqls(versionSql.Sqls)
		for j, subSql := range subsSqls {
			versionSqlSubs = append(versionSqlSubs, VersionSqlSub{
				VersionName: VersionName,
				SqlSeq:      versionSql.SqlSeq,
				SubSeq:      int64(j + 1),
				Sql:         subSql,
				CreateTime:  currentTime,
				UpdateTime:  currentTime,
			})
		}
	}

	return versionSqlSubs, nil
}

func AddVersionRuns(runs []VersionRunBean) error {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`insert into version_run(version_name, tid，tname, sql_seq, sub_seq, 
									create_time, update_time) values(?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, s := range runs {
		_, err = stmt.Exec(s.VersionName, s.Tid, s.Tname, s.SqlSeq, s.SubSeq, s.CreateTime, s.UpdateTime)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	err = tx.Commit()
	return err
}

func AddVersionSqlSubs(subs []VersionSqlSub) error {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`insert into version_sql_sub(version_name, sql_seq, sub_seq, sql, 
									create_time, update_time) values(?, ?, ?, ?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, s := range subs {
		_, err = stmt.Exec(s.VersionName, s.SqlSeq, s.SubSeq, s.Sql, s.CreateTime, s.UpdateTime)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	err = tx.Commit()
	return err
}
