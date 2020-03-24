package sqlweb

import (
	"database/sql"
	"io"
	"log"
	"net/http"
	"os/exec"
	"strings"

	"github.com/bingoohuang/sqlx"
)

func ExportDatabase(w http.ResponseWriter, r *http.Request) {
	tid := strings.TrimSpace(r.FormValue("tid"))

	tdb, err := searchMerchantDb(tid, AppConf.DataSource)
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

	if CommandExist("mysqldump") {
		err = systemMysqldump(tn, w, tdb)
	} else {
		err = customMysqlDump(tn, w, tid)
	}

	if err != nil {
		http.Error(w, err.Error(), 405)
	}
}

func customMysqlDump(tn *Merchant, w http.ResponseWriter, tid string) error {
	w.Header().Set("Content-Type", "text/plain")

	fileName := tn.MerchantCode + "." + TimeNow() + ".sql"
	w.Header().Set("Content-Disposition", "attachment; filename="+fileName)
	log.Println("use custom mysqldump to export database")
	tenantDataSource, _, err := selectDb(tid)
	if err != nil {
		return err
	}
	db, err := sql.Open("mysql", tenantDataSource)
	if err != nil {
		return err
	}
	defer db.Close()
	err = sqlx.MySQLDump(db, w)
	if err != nil {
		return err
	}

	return nil
}

func systemMysqldump(t *Merchant, w http.ResponseWriter, d *MerchantDb) error {
	w.Header().Set("Content-Type", "application/gzip")

	fileName := t.MerchantCode + "." + TimeNow() + ".sql.gz"
	w.Header().Set("Content-Disposition", "attachment; filename="+fileName)
	log.Println("use system mysqldump to export database")
	mysqldump := "mysqldump -h" + d.Host + " -P" + d.Port + " -u" + d.Username + " -p" + d.Password + " " + d.Database + "|gzip"
	cmd := exec.Command("/bin/sh", "-c", mysqldump)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	cmd.Start()
	io.Copy(w, stdout)
	stdout.Close()

	return nil
}
