package main

import (
	"encoding/json"
	"github.com/xwb1989/sqlparser"
	"log"
	"net/http"
	"time"
)

func parseSql(w http.ResponseWriter, r *http.Request, querySql, dbDataSource string) (string, []string, bool) {
	var tableName string
	var primaryKeys []string
	start := time.Now()
	sqlParseResult, _ := sqlparser.Parse(querySql)
	switch sqlParseResult.(type) {
	case *sqlparser.Insert, *sqlparser.Delete, *sqlparser.Update, *sqlparser.Set:
		if !authOk(r) {
			json.NewEncoder(w).Encode(QueryResult{Headers: nil, Rows: nil,
				Error:         "dangerous sql, please get authorized first!",
				ExecutionTime: start.Format("2006-01-02 15:04:05.000"),
				CostTime:      time.Since(start).String(),
			})
			log.Println("sql", querySql, "is not allowed because of insert/delete/update/set")
			return "", nil, false
		}
	case *sqlparser.Select:
		tableName = findSingleTableName(sqlParseResult)
		if tableName != "" {
			primaryKeys = findTablePrimaryKeys(tableName, dbDataSource)
		}
	}

	return tableName, primaryKeys, true
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
	_, data, _, _, err := executeQuery("desc "+tableName, dbDataSource)
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
