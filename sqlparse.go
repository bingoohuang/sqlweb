package main

import (
	"encoding/json"
	"github.com/bingoohuang/go-utils"
	"github.com/xwb1989/sqlparser"
	"log"
	"net/http"
	"strings"
	"time"
)

func parseSql(w http.ResponseWriter, r *http.Request, querySql, dbDataSource string) (bool, string, []string, bool) {
	var tableName string
	var primaryKeys []string
	start := time.Now()
	isSelect := false

	firstWord := strings.ToUpper(go_utils.FirstWord(querySql))
	switch firstWord {
	case "INSERT", "DELETE", "UPDATE", "SET":
		if !authOk(r) {
			json.NewEncoder(w).Encode(QueryResult{Headers: nil, Rows: nil,
				Error:         "dangerous sql, please get authorized first!",
				ExecutionTime: start.Format("2006-01-02 15:04:05.000"),
				CostTime:      time.Since(start).String(),
			})
			log.Println("sql", querySql, "is not allowed because of insert/delete/update/set")
			return isSelect, "", nil, false
		}
	case "SELECT":
		isSelect = true
		sqlParseResult, err := sqlparser.Parse(querySql)
		if err == nil {
			tableName = findSingleTableName(sqlParseResult)
			if tableName != "" {
				primaryKeys = findTablePrimaryKeys(tableName, dbDataSource)
			}
		}
	default:
		isSelect = true
	}

	return isSelect, tableName, primaryKeys, true
}

func findPrimaryKeysIndex(tableName string, primaryKeys, headers []string) []int {
	primaryKeysIndex := make([]int, 0)
	if tableName == "" {
		return primaryKeysIndex
	}

	for _, primaryKey := range primaryKeys {
		for headerIndex, header := range headers {
			if primaryKey == header {
				primaryKeysIndex = append(primaryKeysIndex, headerIndex)
				break
			}
		}
	}

	return primaryKeysIndex
}

func findTablePrimaryKeys(tableName string, dbDataSource string) []string {
	primaryKeys := make([]string, 0)
	_, data, _, _, err, _ := executeQuery("desc "+tableName, dbDataSource)
	if err != nil {
		return primaryKeys
	}

	for _, row := range data {
		if row[4] == "PRI" { // primary keys
			fieldName := row[1]
			primaryKeys = append(primaryKeys, fieldName)
		}
	}

	return primaryKeys
}

func findSingleTableName(sqlParseResult sqlparser.Statement) string {
	selectSql, _ := sqlParseResult.(*sqlparser.Select)
	if len(selectSql.From) != 1 {
		return ""
	}

	aliasTableExpr, ok := selectSql.From[0].(*sqlparser.AliasedTableExpr)
	if !ok {
		return ""
	}

	simpleTableExpr, ok := aliasTableExpr.Expr.(*sqlparser.TableName)
	if !ok {
		return ""
	}

	return string(simpleTableExpr.Name)
}
