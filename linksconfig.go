package sqlweb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/bingoohuang/gou/enc"
	"github.com/bingoohuang/gou/htt"
)

const linksConfigFile = "linksConfig.toml"

func init() {
	if _, err := os.Stat(linksConfigFile); !os.IsNotExist(err) {
		return
	}
	ioutil.WriteFile(linksConfigFile, []byte(`
[tables] # 单表查询时附加语句配置
#	[tables.hogan_pdf]
#    replaceSql = "select user_id, pdf_name, '(BLOB)' pdf_content, CREATE_TIME from hogan_pdf"
#    [tables.f_file]
#    replaceSql = "select file_id, file_name, '(BLOB)' file_content from f_file"

[links]
#    [links.user_id-yoga]
#    classifiers = ["yoga", "yoga-dev"]
#    linksTo = ["tt_f_user", "tt_f_user_role", "tt_f_member", "tt_f_mbr_card.member_id", "tt_f_coach", "tt_f_staff", "tt_f_subscribe", "tt_f_login"]
#    
#    [links.MBR_CARD_ID]
#    classifiers = ["yoga", "yoga-dev"]
#    linksTo = ["tt_f_mbr_card", "tt_l_mbrcard_chg"]

[entries]
     [entries.showTablesWithoutPK]
     type = "link"
     label = "查无主键表"
     sql = """
SELECT
  t.table_schema,
  t.table_name
FROM
  INFORMATION_SCHEMA.TABLES t
  LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS c ON (
    t.TABLE_NAME = c.TABLE_NAME
    AND c.CONSTRAINT_SCHEMA = t.TABLE_SCHEMA
    AND c.constraint_name = 'PRIMARY'
  )
WHERE
  t.table_schema not in (
    'mysql',
    'information_schema',
    'performance_schema',
    'sys'
  )
  AND t.table_type = 'BASE TABLE'
  AND c.constraint_name IS NULL
"""

#    [entries.findTenant]
#    classifiers = ["trr"]
#    type = "input"
#    autoHide  = true
#    placeholder = "逗号分隔的classifier"
#    label = "找库"
#    userTemplate = true
#    sql = "select * from tr_f_merchant where classifier in ({{input|splitToInClause}})"
#
#    [entries.member]
#    type = "input"
#    placeholder = "手机号码/姓名"
#    label = "查找用户"
#    sql = "select * from tt_f_user where nickname like '%{input}%' or mobile like '%{input}%'"
#
#    [entries.merchantYoga]
#    classifiers = ["yoga", "yoga-dev"]
#    type = "link"
#    label = "找馆主"
#    sql = "select * from tt_f_user_role where role_id = '100'"
#    
#    [entries.merchantOther]
#    excludeClassifiers = ["yoga", "yoga-dev"]
#    type = "link"
#    label = "找馆主"
#    sql = "select * from easyhi_user where user_id in (select user_id from easyhi_user_role where role_name = '馆主')"
`), 0644)
}

func ServeSaveLinksConfig(w http.ResponseWriter, r *http.Request) {
	linksConfig := r.FormValue("linksConfig")

	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	err := os.WriteFile(linksConfigFile, []byte(linksConfig), 0644)
	if err != nil {
		_ = json.NewEncoder(w).Encode(struct {
			OK   string
			Json string
		}{
			OK:   err.Error(),
			Json: "{}",
		})
		_, _ = w.Write([]byte(err.Error()))
	} else {
		jsonBytes, err := enc.TomlToJSON([]byte(linksConfig))
		ok := "OK"
		if err != nil {
			ok = err.Error()
		}
		_ = json.NewEncoder(w).Encode(struct {
			LinksConfig string
			OK          string
			Json        string
		}{
			OK:   ok,
			Json: string(jsonBytes),
		})
	}
}

func ServeLoadLinksConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)

	if _, err := os.Stat(linksConfigFile); os.IsNotExist(err) {
		_ = json.NewEncoder(w).Encode(struct {
			LinksConfig string
			Json        string
		}{
			LinksConfig: "",
			Json:        "{}",
		})
		return
	}

	linksConfig, _ := ioutil.ReadFile(linksConfigFile)
	jsonBytes, err := enc.TomlToJSON(linksConfig)
	if err != nil {
		fmt.Println("tomlToJson err:", err.Error())
	}

	_ = json.NewEncoder(w).Encode(struct {
		LinksConfig string
		Json        string
	}{
		LinksConfig: string(linksConfig),
		Json:        string(jsonBytes),
	})
}
