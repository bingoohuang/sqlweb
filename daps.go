package sqlweb

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"time"

	"github.com/bingoohuang/gou/htt"
	"github.com/bingoohuang/ngg/ss"
	"github.com/mitchellh/go-homedir"
	"gopkg.in/yaml.v3"
)

type Result struct {
	Query          bool     `json:"query"`
	FirstWordLower string   `json:"first_word_lower"`
	Executed       bool     `json:"executed"`
	Effected       int      `json:"effected"`
	ResultSet      []any    `json:"resultSet"`
	RowCount       int      `json:"rowCount"`
	CostNano       int      `js:"costNano"`
	CipherColumns  []string `json:"cipherColumns"`

	ColumnTypes map[string]string `json:"resultColumnTypes"`

	ColumnLabels []string `json:"columnLabels"`
	ColumnCount  int      `json:"columnCount"`
	ExecuteBatch []int    `js:"executeBatch"`
	TimesResult  []Result `js:"timesResult"`
	ExeTimes     int      `js:"exeTimes"`
	Args         []any    `js:"args"`

	RewrittenSql        string `js:"rewrittenSql"`
	RewrittenParameters []any  `js:"rewrittenParameters"`

	G4CostNano         int  `json:"g4CostNano"`         // antlr 解析 SQL 的时间
	RealCost           int  `json:"realCost"`           // 实际时间（缓存后不需要再次 antlr 解析了）
	HasEncryptionTable bool `json:"hasEncryptionTable"` // 是否包含加密表
	RewriteTokens      int  `json:"rewriteTokens"`      // SQL 改写的 token 数量
	ParsedOK           bool `json:"parsedOK"`           // SQL 解析是否成功

	Error string `json:"error"` // 异常消息

	RunResult *RunResult `json:"runResult"`
}

func (r *Result) Headers() []string {

	if len(r.CipherColumns) > 0 {
		headers := make([]string, 0, len(r.ColumnLabels)-1)
		for i, columnLabel := range r.ColumnLabels {
			if i == 0 {
				continue
			}
			if slices.Contains(r.CipherColumns, columnLabel) {
				columnLabel += "🛡"
			}
			headers = append(headers, columnLabel)
		}

		return headers
	}

	return r.ColumnLabels[1:]
}

func (r *Result) IndexedRows() [][]string {
	var rows [][]string

	headers := r.ColumnLabels[1:]
	for i, row := range r.ResultSet {
		rowMap := row.(map[string]any)
		var row []string
		row = append(row, fmt.Sprintf("%d", i+1))
		for _, header := range headers {
			cell := rowMap[header]
			if cell == nil {
				row = append(row, "(null)")
			} else if cellString, ok := cell.(string); ok {
				row = append(row, cellString)
			} else {
				columnType := r.ColumnTypes[header]
				switch strings.ToUpper(columnType) {
				case "TIMESTAMP", "DATETIME":
					row = append(row, convertToTimestamp(cell))
				default:
					row = append(row, fmt.Sprintf("%v", cell))
				}
			}
		}
		rows = append(rows, row)
	}

	return rows
}

func convertToTimestamp(cell any) string {
	switch cell := cell.(type) {
	case float64:
		return time.UnixMilli(int64(cell)).Format("2006-01-02 15:04:05.000")
	default:
		return fmt.Sprintf("%v", cell)
	}
}

type Daps struct {
	Java        string   `yaml:"java"`
	Classpath   []string `yaml:"classpath"`
	Connections []Conn   `yaml:"connections"`
}

type Conn struct {
	Name             string `yaml:"name"`             // 链接名称
	Url              string `yaml:"url"`              // 链接 URL
	User             string `yaml:"user"`             // 用户名
	Driver           string `yaml:"driver"`           // daps6 底层驱动
	Debug            int    `yaml:"debug"`            // 调试级别
	ConfigFile       string `yaml:"configFile"`       // 配置文件
	AlterDbNames     string `yaml:"alterDbNames"`     // 替换数据库名称
	AlterSchemaNames string `yaml:"alterSchemaNames"` // 替换 schema 名称
	AlterDbHosts     string `yaml:"alterDbHosts"`     // 替换数据库主机
}

func LoadDaps(file string) (*Daps, error) {
	var err error
	file, err = homedir.Expand(file)
	if err != nil {
		return nil, err
	}

	// 文件不存在时，不报错
	if _, err := os.Stat(file); os.IsNotExist(err) {
		return &Daps{}, nil
	}

	jsonData, err := os.ReadFile(file)
	if err != nil {
		return nil, err
	}

	var daps Daps
	yaml.Unmarshal(jsonData, &daps)
	return &daps, nil
}

func (daps *Daps) GetConn(name string) *Conn {
	for _, conn := range daps.Connections {
		if conn.Name == name {
			return &conn
		}
	}
	return nil
}

func (daps *Daps) Save(file string) error {
	jsonData, err := json.Marshal(daps)
	if err != nil {
		return err
	}
	return os.WriteFile(file, jsonData, 0644)
}

type RunResult struct {
	InputFile  string `json:"inputFile"`
	ResultFile string `json:"resultFile"`

	Log  string `json:"log"`
	Cmd  string `json:"cmd"`
	Exit int    `json:"exit"`
}

func (daps *Daps) runFile(filePath string) (*RunResult, error) {
	if len(daps.Classpath) == 0 {
		daps.Classpath = []string{"~/.daps6/libs/*.jar"}
	}
	classpath := createClassPath(daps.Classpath)

	if daps.Java == "" {
		daps.Java = "java"
	} else {
		daps.Java, _ = homedir.Expand(daps.Java)
	}
	args := []string{daps.Java,
		"-Dfile.encoding=UTF-8", "-Dconsole.encoding=UTF-8",
		"-cp", classpath, "cn.bjca.daps6.client.Main", "-c", filePath,
	}

	cmdArgs := strings.Join(args, " ")
	// 构建Java命令
	javaCmd := exec.Command("bash", "-c", cmdArgs)
	if IsWindows {
		javaCmd = exec.Command("cmd", "/c", cmdArgs)
	}

	var out bytes.Buffer
	// 重定向标准输出和错误输出到日志文件
	javaCmd.Stdout = &out
	javaCmd.Stderr = &out

	// 执行Java命令
	log.Printf("执行命令: %s", javaCmd)
	if err := javaCmd.Run(); err != nil {
		return nil, fmt.Errorf("执行命令失败: %v", err)
	}

	log.Printf("命令执行完成")

	consoleLog := out.String()
	log.Println(consoleLog)
	return &RunResult{
		InputFile:  filePath,
		ResultFile: filePath + ".json",
		Log:        out.String(),
		Cmd:        cmdArgs,
		Exit:       javaCmd.ProcessState.ExitCode(),
	}, nil
}

var IsWindows = runtime.GOOS == "windows"

func createClassPath(classpaths []string) string {
	var files []string

	for _, classpath := range classpaths {
		cp, _ := homedir.Expand(classpath)

		// 手动展开通配符
		cpFiles, err := filepath.Glob(cp)
		if err != nil {
			log.Fatal(err)
		}
		files = append(files, cpFiles...)
	}

	//  Unix/Linux 使用 ":"，Windows 使用 ";"
	sep := ss.If(IsWindows, ";", ":")
	classpath := strings.Join(files, sep)
	return classpath
}

func DapsQuery(connName, querySql string) (headers []string, data [][]string, executionTimestamp, costTime, msg string, result *Result, err error) {
	executionTimestamp = time.Now().Format("2006-01-02 15:04:05.000")
	result, err = DapsExec(querySql, connName)
	if err != nil {
		return
	}

	if result.Error != "" {
		err = errors.New(result.Error)
		return
	}

	costTime = time.Duration(result.CostNano).String()
	if !result.Query {
		effected := result.Effected
		for _, timesResult := range result.TimesResult {
			effected += timesResult.Effected
		}
		msg = fmt.Sprintf("更新%d行", effected)
		return
	}

	return result.Headers(), result.IndexedRows(), executionTimestamp, costTime, msg, result, nil
}

func DapsUpdate(connName, querySql string) (updateResult UpdateResult, err error) {
	var result *Result
	result, err = DapsExec(querySql, connName)
	if err != nil {
		return
	}

	var resultRows []UpdateResultRow
	if result.Error != "" {
		resultRows = append(resultRows, UpdateResultRow{Ok: false, Message: result.Error})
	} else {
		message := fmt.Sprintf("更新%d行", result.Effected)
		resultRows = append(resultRows, UpdateResultRow{Ok: false, Message: message})
	}

	return UpdateResult{Ok: true, Message: "Ok", RowsResult: resultRows}, nil
}

func DapsExec(querySql string, connName string) (*Result, error) {
	daps, err := LoadDaps("~/.sqlweb.daps.yaml")
	if err != nil {
		return nil, err
	}
	conn := daps.GetConn(connName)
	if conn == nil {
		return nil, errors.New("connection not found")
	}

	var tempFile string
	tempFile, err = createSqlFile(querySql, conn)
	if err != nil {
		return nil, err
	}
	log.Println("tempFile", tempFile)
	runResult, err := daps.runFile(tempFile)
	if err != nil {
		return nil, err
	}

	var result Result

	resultData, err := os.ReadFile(runResult.ResultFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read result file: %w", err)
	}

	if err := json.Unmarshal(resultData, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal result: %w", err)
	}

	result.RunResult = runResult
	return &result, nil
}

func createSqlFile(querySql string, conn *Conn) (string, error) {
	// 创建临时SQL文件
	tempFile, err := os.CreateTemp("", "sqlweb_*.sql")
	if err != nil {
		return "", err
	}
	defer tempFile.Close()

	if conn.ConfigFile != "" {
		tempFile.WriteString("-- configFile: " + conn.ConfigFile + "\n")

		if conn.AlterDbNames != "" {
			tempFile.WriteString("-- alterDbNames: " + conn.AlterDbNames + "\n")
		}
		if conn.AlterSchemaNames != "" {
			tempFile.WriteString("-- alterSchemaNames: " + conn.AlterSchemaNames + "\n")
		}
		if conn.AlterDbHosts != "" {
			tempFile.WriteString("-- alterDbHosts: " + conn.AlterDbHosts + "\n")
		}
	}

	tempFile.WriteString("-- url: " + conn.Url + "\n")
	tempFile.WriteString("-- user: " + conn.User + "\n")

	// 将SQL查询写入临时文件
	tempFile.WriteString(querySql + "\n")
	tempFile.WriteString("-- resultFile: " + tempFile.Name() + ".json" + "\n")
	return tempFile.Name(), nil
}

//go:embed daps.yaml
var dapsJSON string

func LoadDapsConfigFile(w http.ResponseWriter, r *http.Request) error {
	connName := r.FormValue("connName")
	daps, err := LoadDaps("~/.sqlweb.daps.yaml")
	if err != nil {
		return err
	}
	conn := daps.GetConn(connName)
	if conn == nil {
		return errors.New("connection not found")
	}

	if conn.ConfigFile == "" {
		return errors.New("当前连接没有配置策略")
	}

	content, err := os.ReadFile(conn.ConfigFile)
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	return json.NewEncoder(w).Encode(struct {
		Data string
	}{
		Data: string(content),
	})
}

func SaveDapsConfigFile(w http.ResponseWriter, r *http.Request) error {
	connName := r.FormValue("connName")
	daps, err := LoadDaps("~/.sqlweb.daps.yaml")
	if err != nil {
		return err
	}
	conn := daps.GetConn(connName)
	if conn == nil {
		return errors.New("connection not found")
	}

	data := r.FormValue("data")
	if err := os.WriteFile(conn.ConfigFile, []byte(data), 0644); err != nil {
		return err
	}

	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	return json.NewEncoder(w).Encode(struct {
		OK string
	}{
		OK: "OK",
	})
}

func LoadDapsOpptions(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Content-Type", htt.ContentTypeJSON)

	file, err := homedir.Expand("~/.sqlweb.daps.yaml")
	if err != nil {
		return err
	}

	if _, err := os.Stat(file); os.IsNotExist(err) {
		_ = json.NewEncoder(w).Encode(struct {
			Data string
		}{
			Data: dapsJSON,
		})
		return err
	}

	data, _ := os.ReadFile(file)

	return json.NewEncoder(w).Encode(struct {
		Data string
	}{
		Data: string(data),
	})
}

func SaveDapsOpptions(w http.ResponseWriter, r *http.Request) error {
	data := r.FormValue("data")

	file, err := homedir.Expand("~/.sqlweb.daps.yaml")
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", htt.ContentTypeJSON)
	if err := os.WriteFile(file, []byte(data), 0644); err != nil {
		return err
	}

	_ = json.NewEncoder(w).Encode(struct {
		OK string
	}{
		OK: "OK",
	})
	return nil
}
