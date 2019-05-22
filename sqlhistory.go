package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"github.com/bingoohuang/gou"
	"os"
	"strconv"
	"strings"
	"time"
)

type SqlHistory struct {
	SqlTime string
	Sql     string
	Tids    string
}

func isByPassedSql(sql string) bool {
	return sql == "show tables" ||
		strings.Index(sql, "show create table") == 0 ||
		strings.Index(sql, "show full columns from") == 0 ||
		strings.Index(sql, "select * from") == 0
}

func saveHistory(tids, sql string) {
	if isByPassedSql(sql) {
		return
	}

	sqlHistory := SqlHistory{
		SqlTime: time.Now().Format("2006-01-02 15:04:05.000"),
		Sql:     sql,
		Tids:    tids,
	}
	json, _ := json.Marshal(sqlHistory)
	file, _ := os.OpenFile("sqlHistory.json", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0660)
	file.Write(json)
	file.WriteString("\n")
	file.Close()
}

func showHistory() (header []string, data [][]string, executionTime, costTime string, err error, msg string) {
	start := time.Now()
	executionTime = start.Format("2006-01-02 15:04:05.000")

	file, err := os.OpenFile("sqlHistory.json", os.O_RDONLY, 0660)
	if err != nil {
		costTime = time.Since(start).String()
		err = errors.New("no history")
		return
	}
	defer file.Close()

	reader := bufio.NewReader(file)

	deque := gou.NewFifoQueue(30)
	for {
		rowData, err := reader.ReadBytes('\n')
		if err != nil {
			break
		}

		len := len(rowData)
		if len == 0 {
			break
		}

		var history SqlHistory
		json.Unmarshal(rowData, &history)

		if isByPassedSql(history.Sql) {
			continue
		}

		deque.Append(history)
	}

	header = []string{"ExecutionTime", "Sql", "Tenant IDs"}
	data = make([][]string, 0)
	rowIndex := 0
	for {
		item := deque.Pop()
		if item == nil {
			break
		}

		his := item.(SqlHistory)

		rowIndex++
		row := []string{strconv.Itoa(rowIndex), his.SqlTime, his.Sql, his.Tids}
		data = append(data, row)
	}

	costTime = time.Since(start).String()
	err = nil
	msg = ""
	return
}
