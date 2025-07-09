package sqlweb

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-sql-driver/mysql"

	"github.com/bingoohuang/gou/htt"
)

type Merchant struct {
	MerchantName string
	MerchantId   string
	MerchantCode string
	HomeArea     string
	Classifier   string
}

func ServeSearchDb(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	searchKey := strings.TrimSpace(req.FormValue("searchKey"))
	byTenant := strings.TrimSpace(req.FormValue("byTenant"))
	if searchKey == "" {
		http.Error(w, "searchKey required", 405)
		return
	}

	cookieValue := req.Context().Value(LoginUserKey)
	var user *LoginUser
	if cookieValue != nil {
		user = cookieValue.(*LoginUser)
	}

	if user != nil && user.Limit2ConfigDSN {
		var searchResult []Merchant
		for _, dbIndex := range user.DSNGroups {
			if dsn := AppConf.GetDSN(dbIndex); dsn != "" {
				tid, _ := FindDbName(dsn)
				if user.DefaultDB == dbIndex {
					searchResult = append([]Merchant{
						{MerchantName: tid, MerchantId: "sdb-" + tid,
							MerchantCode: "sdb-" + tid, HomeArea: "sdb-" + tid, Classifier: "sdb-" + tid}}, searchResult...)
				} else {
					searchResult = append(searchResult,
						Merchant{MerchantName: tid, MerchantId: "sdb-" + tid,
							MerchantCode: "sdb-" + tid, HomeArea: "sdb-" + tid, Classifier: "sdb-" + tid})
				}

			}
		}

		json.NewEncoder(w).Encode(searchResult)
		return
	}

	if searchKey == "trr" {
		var searchResult [1]Merchant
		searchResult[0] = Merchant{
			MerchantName: "trr",
			MerchantId:   "trr",
			MerchantCode: "trr",
			HomeArea:     "BJ",
			Classifier:   "trr"}
		json.NewEncoder(w).Encode(searchResult)
		return
	}

	var searchResult []Merchant

	if AppConf.DSN != "" {
		searchSql := ""
		if byTenant == "true" {
			searchSql = "SELECT MERCHANT_NAME, MERCHANT_ID, MERCHANT_CODE, HOME_AREA, CLASSIFIER " +
				"FROM sqlweb WHERE MERCHANT_ID = '" + searchKey + "' OR MERCHANT_CODE = '" + searchKey + "'"
		} else {
			searchSql = "SELECT MERCHANT_NAME, MERCHANT_ID, MERCHANT_CODE, HOME_AREA, CLASSIFIER " +
				"FROM sqlweb WHERE MERCHANT_ID = '" + searchKey +
				"' OR MERCHANT_CODE = '" + searchKey + "' OR MERCHANT_NAME LIKE '%" + searchKey + "%'"
		}

		_, data, _, _, _, err := executeQuery(searchSql, AppConf.DSN, 0)
		if err != nil {
			if ignorable := Contains(err.Error(), "doesn't exist", "Unknown table", "No database selected"); !ignorable {
				http.Error(w, err.Error(), 405)
				return
			}
		}

		if len(data) == 0 && err == nil && AppConf.OnlyShowSqlWebDatabases {
			searchResult = append(searchResult,
				Merchant{MerchantName: "trr", MerchantId: "trr", MerchantCode: "trr", HomeArea: "BJ", Classifier: "trr"})
			json.NewEncoder(w).Encode(searchResult)
			return
		}

		for _, v := range data {
			tid := v[2]
			if tid != "trr" {
				searchResult = append(searchResult,
					Merchant{MerchantName: v[1], MerchantId: tid, MerchantCode: v[3], HomeArea: v[4], Classifier: v[5]})
			}
		}

		// 添加库列表
		if !AppConf.OnlyShowSqlWebDatabases {
			_, data, _, _, _, _ = executeQuery("show databases", AppConf.DSN, 0)
			for _, v := range data {
				tid := v[1]
				searchResult = append(searchResult,
					Merchant{MerchantName: tid, MerchantId: "sdb-" + tid,
						MerchantCode: "sdb-" + tid, HomeArea: "sdb-" + tid, Classifier: "sdb-" + tid})
			}
		}
	}

	daps, err := LoadDaps("~/.sqlweb.daps.yaml")
	if err != nil {
		http.Error(w, err.Error(), 405)
		return
	}

	for _, c := range daps.Connections {
		searchResult = append(searchResult,
			Merchant{MerchantName: "daps-" + c.Name, MerchantId: "daps-" + c.Name,
				MerchantCode: "daps-" + c.Name, HomeArea: "daps-" + c.Name, Classifier: "daps-" + c.Name})
	}

	json.NewEncoder(w).Encode(searchResult)
}

func Contains(s string, sub ...string) bool {
	for _, ss := range sub {
		if strings.Contains(s, ss) {
			return true
		}
	}

	return false
}

type MerchantDb struct {
	MerchantId string
	Username   string
	Password   string
	Host       string
	Port       string
	Database   string
}

func searchMerchantDb(tid string, ds string) (*MerchantDb, error) {
	if strings.HasPrefix(tid, "sdb-") {
		return parseMerchantDbByDirect(strings.TrimPrefix(tid, "sdb-"))
	}

	sql := "SELECT MERCHANT_ID, DB_USERNAME, DB_PASSWORD, PROXY_IP, PROXY_PORT, DB_NAME " +
		"FROM sqlweb WHERE MERCHANT_ID = '" + tid + "'"

	_, data, _, _, _, err := executeQuery(sql, ds, 1)
	if err != nil {
		return nil, err
	}

	if len(data) != 1 {
		return nil, errors.New("none or more than one found for tid:" + tid)
	}
	v := data[0]

	return &MerchantDb{MerchantId: v[1], Username: v[2],
		Password: v[3], Host: v[4], Port: v[5], Database: v[6]}, nil
}

func parseMerchantDbByDirect(tid string) (*MerchantDb, error) {
	dc, err := mysql.ParseDSN(AppConf.DSN)
	if err != nil {
		return nil, err
	}

	host := dc.Addr
	port := "3306"
	if idx := strings.LastIndex(dc.Addr, ":"); idx > 0 {
		host = dc.Addr[:idx]
		port = dc.Addr[idx+1:]
	}

	return &MerchantDb{MerchantId: tid, Username: dc.User,
		Password: dc.Passwd, Host: host, Port: port, Database: tid}, nil
}

func searchMerchant(tid string) (*Merchant, error) {
	if strings.HasPrefix(tid, "sdb-") {
		return &Merchant{MerchantName: tid, MerchantId: tid,
			MerchantCode: tid, HomeArea: tid, Classifier: tid}, nil
	}

	if tid == "trr" {
		return &Merchant{MerchantName: tid, MerchantId: tid, MerchantCode: tid,
			HomeArea: AppConf.TrrHomeArea, Classifier: tid}, nil
	}

	sql := "SELECT MERCHANT_NAME, MERCHANT_ID, MERCHANT_CODE, HOME_AREA, CLASSIFIER " +
		"FROM sqlweb WHERE MERCHANT_ID = '" + tid + "'"

	return searchMerchantBySql(sql, 1)
}

func searchMerchantByTcode(tcode string) (*Merchant, error) {
	if strings.HasPrefix(tcode, "sdb-") {
		return &Merchant{MerchantName: tcode, MerchantId: tcode,
			MerchantCode: tcode, HomeArea: tcode, Classifier: tcode}, nil
	}

	sql := "SELECT MERCHANT_NAME, MERCHANT_ID, MERCHANT_CODE, HOME_AREA, CLASSIFIER " +
		"FROM sqlweb WHERE MERCHANT_CODE = '" + tcode + "'"

	return searchMerchantBySql(sql, 1)
}

func searchMerchantBySql(searchSql string, maxRows int) (*Merchant, error) {
	_, data, _, _, _, err := executeQuery(searchSql, AppConf.DSN, maxRows)
	if err != nil {
		return nil, err
	}

	if len(data) != 1 {
		return nil, errors.New("merchant query result " + strconv.Itoa(len(data)) + " other than 1")
	}

	v := data[0]

	return &Merchant{MerchantName: v[1], MerchantId: v[2], MerchantCode: v[3], HomeArea: v[4], Classifier: v[5]}, nil
}
