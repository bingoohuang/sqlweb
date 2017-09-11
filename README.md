# go-sql-web
sql web based on go-lang


# build
1. `go get -u github.com/jteeuwen/go-bindata/...`
2. `go get golang.org/x/tools/cmd/goimports`
3. `./gobin.sh & go build` 
5. build for linux :`env GOOS=linux GOARCH=amd64 go build -o go-sql-web.linux.bin`

# startup
```
bingoo@bingodeMacBook-Pro ~/G/go-sql-web> ./go-sql-web -h
Usage of ./go-sql-web:
  -agentId string
    	agentId
  -contextPath string
    	context path
  -cookieName string
    	cookieName (default "easyhi_qyapi")
  -corpId string
    	corpId
  -corpSecret string
    	cropId
  -dataSource string
    	dataSource string. (default "user:pass@tcp(127.0.0.1:3306)/db?charset=utf8")
  -devMode
    	devMode(disable js/css minify)
  -key string
    	key to encyption or decyption
  -maxRows int
    	Max number of rows to return. (default 1000)
  -port int
    	Port to serve. (default 8381)
  -redirectUri string
    	redirectUri
  -writeAuthRequired
    	write auth required (default true)
```

# snapshots

![image](https://user-images.githubusercontent.com/1940588/30257639-1aa0c41e-9679-11e7-8246-3abe87ba5510.png)
