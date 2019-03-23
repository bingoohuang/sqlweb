package main

import (
	"net/http"
	"strings"

	go_utils "github.com/bingoohuang/go-utils"
	"github.com/xwb1989/sqlparser"
)

func parseSql(querySql, dbDataSource string) (string, []string) {
	var tableName string
	var primaryKeys []string
	firstWord := strings.ToUpper(go_utils.FirstWord(querySql))
	switch firstWord {
	case "SELECT":
		sqlParseResult, err := sqlparser.Parse(querySql)
		if err == nil {
			tableName = findSingleTableName(sqlParseResult)
			if tableName != "" {
				primaryKeys = findTablePrimaryKeys(tableName, dbDataSource)
			}
		}
	default:
	}

	return tableName, primaryKeys
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
	if selectSql == nil || len(selectSql.From) != 1 {
		return ""
	}

	aliasTableExpr, ok := selectSql.From[0].(*sqlparser.AliasedTableExpr)
	if !ok {
		return ""
	}

	return sqlparser.GetTableName(aliasTableExpr.Expr).String()
}
