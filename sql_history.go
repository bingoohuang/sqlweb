package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"os"
	"strconv"
	"time"
)

type SqlHistory struct {
	SqlTime string
	Sql     string
}

func saveHistory(sql string) {
	sqlHistory := SqlHistory{
		time.Now().Format("2006-01-02 15:04:05.000"),
		sql,
	}
	json, _ := json.Marshal(sqlHistory)
	file, _ := os.OpenFile("sqlHistory.json", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0660)
	file.Write(json)
	file.WriteString("\n")
	file.Close()
}

func showHistory() (header []string, data [][]string, executionTime, costTime string, err error, msg string) {
	header = nil
	data = nil
	start := time.Now()
	executionTime = start.Format("2006-01-02 15:04:05.000")

	file, err := os.OpenFile("sqlHistory.json", os.O_RDONLY, 0660)
	if err != nil {
		costTime = time.Since(start).String()
		err = errors.New("no history")
		return
	}
	defer file.Close()

	header = []string{"ExecutionTime", "Sql"}
	data = make([][]string, 0)

	reader := bufio.NewReader(file)
	rowIndex := 0
	for {
		rowData, err := reader.ReadBytes('\n')
		if err != nil {
			break
		}

		len := len(rowData)
		if len == 0 {
			break
		}

		rowIndex++
		var sqlHistory SqlHistory
		json.Unmarshal(rowData, &sqlHistory)
		row := []string{strconv.Itoa(rowIndex), sqlHistory.SqlTime, sqlHistory.Sql}

		data = append([][]string{row}, data...)
	}

	costTime = time.Since(start).String()
	err = nil
	msg = ""
	return
}
