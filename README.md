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

# others
## 如何在Mac上关闭后退和前进触控板手势
![image](https://user-images.githubusercontent.com/1940588/32092964-25d5074a-bb2d-11e7-9f87-38e7cad7669f.png)

方法1：如果您使用Mac笔记本电脑进行冲浪，您可能已经注意到，在触控板上向左或向右轻轻滑动两个手指会导致网络浏览器向前和向后翻页。 对于一些人来说，这是一个伟大的。 对于其他人来说，它偶然发生的比意外发生更频繁，这可能是恼人的。
![image](https://user-images.githubusercontent.com/1940588/30794523-31e07604-a18e-11e7-9835-4bbf5c38cee5.png)

方法2: 执行命令`defaults write com.google.Chrome AppleEnableSwipeNavigateWithScrolls -bool FALSE`
