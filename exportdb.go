package main

import (
	"database/sql"
	"github.com/bingoohuang/go-utils"
	"io"
	"log"
	"net/http"
	"os/exec"
	"strings"
	"time"
)

func exportDatabase(w http.ResponseWriter, r *http.Request) {
	tid := strings.TrimSpace(r.FormValue("tid"))

	tdb, err := searchMerchantDb(tid, g_dataSource)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	tn, err := searchMerchant(tid)
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	w.Header().Set("Content-Transfer-Encoding", "binary")
	w.Header().Set("Content-Type", "text/plain")

	if CommandExist("mysqldump") {
		fileName := tn.MerchantCode + "." + time.Now().Format("20060102150405") + ".sql.gz"
		w.Header().Set("Content-Disposition", "attachment; filename="+fileName)

		log.Println("user system mysqldump to export database")
		mysqldump := "mysqldump -h  " + tdb.Host + " -P" + tdb.Port + " -u" + tdb.Username + " -p" + tdb.Password + "  " + tdb.Database + " | gzip"
		cmd := exec.Command("/bin/sh", "-c", mysqldump)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
		cmd.Start()

		io.Copy(w, stdout)
		stdout.Close()
	} else {
		fileName := tn.MerchantCode + "." + time.Now().Format("20060102150405") + ".sql"
		w.Header().Set("Content-Disposition", "attachment; filename="+fileName)
		log.Println("user custome mysqldump to export database")
		tenantDataSource, _, err := selectDb(tid)
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
		db, err := sql.Open("mysql", tenantDataSource)
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
		defer db.Close()

		err = go_utils.MySqlDump(db, w)
		if err != nil {
			http.Error(w, err.Error(), 405)
			return
		}
	}
}

func CommandExist(command string) bool {
	out, _ := exec.Command("which", command).Output()
	log.Println(command, string(out))
	return len(out) != 0
}
