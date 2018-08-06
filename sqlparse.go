package main

import (
	"github.com/bingoohuang/go-utils"
	"github.com/xwb1989/sqlparser"
	"net/http"
	"strings"
)

func parseSql(querySql, dbDataSource string) (bool, string, []string, bool) {
	var tableName string
	var primaryKeys []string
	isSelect := false
	firstWord := strings.ToUpper(go_utils.FirstWord(querySql))
	switch firstWord {
	case "SELECT":
		isSelect = true
		sqlParseResult, err := sqlparser.Parse(querySql)
		if err == nil {
			tableName = findSingleTableName(sqlParseResult)
			if tableName != "" {
				primaryKeys = findTablePrimaryKeys(tableName, dbDataSource)
			}
		}
	case "SHOW":
		isSelect = true
	case "INSERT", "DELETE", "UPDATE", "SET":
		fallthrough
	default:
	}

	return isSelect, tableName, primaryKeys, true
}

func writeAuthOk(r *http.Request) bool {
	return len(appConfig.WriteAuthUserNames) == 0 ||
		go_utils.IndexOf(loginedUserName(r), appConfig.WriteAuthUserNames) >= 0
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
	_, data, _, _, err, _ := executeQuery("desc "+tableName, dbDataSource, 0)
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
