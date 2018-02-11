package main

import (
	"database/sql"
	"encoding/json"
	_ "github.com/mattn/go-sqlite3"
	"net/http"
	"strings"
	"time"
)

type Version struct {
	VersionName string
	VersionDesc string
	Prepared    bool
	CreateTime  string
	UpdateTime  string
}

type ListVersionResponse struct {
	Ok       string
	Versions []Version
}

func serveListVersions(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	versions, err := ListVersions()
	var listVersion ListVersionResponse
	listVersion.Versions = versions
	if err != nil {
		listVersion.Ok = err.Error()
	}

	json.NewEncoder(w).Encode(listVersion)
}

func ListVersions() ([]Version, error) {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	versions := make([]Version, 0)

	sqlStmt := `select version_name, version_desc, prepared, create_time, update_time from version order by update_time desc limit 10`
	rows, err := db.Query(sqlStmt)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var v Version
		err = rows.Scan(&v.VersionName, &v.VersionDesc, &v.Prepared, &v.CreateTime, &v.UpdateTime)
		if err != nil {
			return nil, err
		}

		versions = append(versions, v)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return versions, nil
}

type SimpleResponse struct {
	Ok string
}

type UpdateResponse struct {
	Ok           string
	RowsAffected int64
}

func serveAddVersion(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	versionName := strings.TrimSpace(req.FormValue("versionName"))
	versionDesc := strings.TrimSpace(req.FormValue("versionDesc"))

	createTime := time.Now().Format(`006-01-02 15:04:05`)
	err := AddVersion(Version{
		VersionName: versionName,
		VersionDesc: versionDesc,
		CreateTime:  createTime,
		UpdateTime:  createTime,
	})

	var addVersion SimpleResponse
	if err != nil {
		addVersion.Ok = err.Error()
	}

	json.NewEncoder(w).Encode(addVersion)
}

func AddVersion(version Version) error {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`insert into version(version_name, version_desc, create_time, update_time) values(?, ?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()
	_, err = stmt.Exec(version.VersionName, version.VersionDesc, version.CreateTime, version.UpdateTime)
	if err != nil {
		tx.Rollback()
		return err
	}

	err = tx.Commit()
	return err
}

func serveUpdateVersion(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	oldVersionName := strings.TrimSpace(req.FormValue("oldVersionName"))
	versionName := strings.TrimSpace(req.FormValue("versionName"))
	versionDesc := strings.TrimSpace(req.FormValue("versionDesc"))
	updateTime := time.Now().Format(`006-01-02 15:04:05`)

	rowsAffected, err := UpdateVersion(oldVersionName, Version{
		VersionName: versionName,
		VersionDesc: versionDesc,
		UpdateTime:  updateTime,
	})

	response := UpdateResponse{
		RowsAffected: rowsAffected,
	}
	if err != nil {
		response.Ok = err.Error()
	}

	json.NewEncoder(w).Encode(response)
}

func UpdateVersionPrepared(VersionName string) (int64, error) {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return 0, err
	}
	defer db.Close()

	result, err := db.Exec(`update version set prepared = 1 where version_name = ?`, VersionName)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

func UpdateVersion(oldVersionName string, version Version) (int64, error) {
	db, err := sql.Open("sqlite3", "./version.db")
	if err != nil {
		return 0, err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	stmt, err := tx.Prepare(`update version set version_name = ?, version_desc = ?, update_time = ? where version_name = ?`)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()
	result, err := stmt.Exec(version.VersionName, version.VersionDesc, version.UpdateTime, oldVersionName)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	rowsAffected, _ := result.RowsAffected()

	err = tx.Commit()
	return rowsAffected, err
}
