# go-sql-web
sql web based on golang


# build
1. install golang 1.11+
1. `go get -u -v github.com/jteeuwen/go-bindata/...`
2. `go get -u -v golang.org/x/tools/cmd/goimports`
3. git clone git@github.com:bingoohuang/go-sql-web.git & cd go-sql-web
3. `./gobin.sh ; go mod tidy ; go build -x -v` 
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

Main page:

![image](https://user-images.githubusercontent.com/1940588/30257639-1aa0c41e-9679-11e7-8246-3abe87ba5510.png)

LinksTo & Fast Entries:

![image](https://user-images.githubusercontent.com/1940588/34432496-b5c56136-ecb2-11e7-8d96-a7ce803da0c0.png)

LinksTo & Fast Entries Config:

![image](https://user-images.githubusercontent.com/1940588/34432497-b9dd4d9c-ecb2-11e7-95a2-2fb8f8bdd229.png)

Show table column info（Right click on the cell）:

![image](https://user-images.githubusercontent.com/1940588/37504346-b0c7c0f0-2918-11e8-8eee-c8e67d12b249.png)


Table head context menu:

![image](https://user-images.githubusercontent.com/1940588/37504433-440c1fd2-2919-11e8-848e-0ba7e85b11bb.png)

More Tools for single table (Left click on the ...) :

![image](https://user-images.githubusercontent.com/1940588/37504406-120e6314-2919-11e8-8ba1-18c1a4c103b9.png)

Sql Templates:
![image](https://user-images.githubusercontent.com/1940588/41340166-5089419e-6f29-11e8-8b1b-599a5833b657.png)

Copy Columns As TSV(Tab separated values, can be pasted in Excel very well):
![image](https://user-images.githubusercontent.com/1940588/41292402-0d0b5622-6e85-11e8-97ba-d27accff362b.png)



# others
## 如何在Mac上关闭后退和前进触控板手势
![image](https://user-images.githubusercontent.com/1940588/32092964-25d5074a-bb2d-11e7-9f87-38e7cad7669f.png)

方法1：如果您使用Mac笔记本电脑进行冲浪，您可能已经注意到，在触控板上向左或向右轻轻滑动两个手指会导致网络浏览器向前和向后翻页。 对于一些人来说，这是一个伟大的。 对于其他人来说，它偶然发生的比意外发生更频繁，这可能是恼人的。
![image](https://user-images.githubusercontent.com/1940588/30794523-31e07604-a18e-11e7-9835-4bbf5c38cee5.png)

方法2: 执行命令`defaults write com.google.Chrome AppleEnableSwipeNavigateWithScrolls -bool FALSE`

## refer
1. [使用 dep 管理 Go 套件](https://blog.boatswain.io/zh/post/manage-go-dependencies-using-dep/)

## UPX
[Citing: ](https://grahamenos.com/rust-osx-linux-musl.html)If you’re concerned about the binary size of your new executable, check out UPX. After installing it on my laptop via brew install upx, I ran upx -9 on an executable created with the above instructions. While the executable was an overly simplistic example, upx compressed it down to 34% of the original size. Even if you don’t care about the size of the binary once it’s on the server, it at least made the scp go faster.


# Some useful javascript snippet

## date and time [datajs](http://www.datejs.com/)
```javascript
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/datejs/date.js';
document.head.appendChild(script);

var jan312009 = new Date(2009, 1-1, 31);
var oneMonthFromJan312009 = new Date(jan312009).add(1).month();

// What date is next thursday?
Date.today().next().thursday();
 
// Add 3 days to Today
Date.today().add(3).days();
 
// Is today Friday?
Date.today().is().friday();
 
// Number fun
(3).days().ago();
 
// 6 months from now
var n = 6;
n.months().fromNow();
 
// Set to 8:30 AM on the 15th day of the month
Date.today().set({ day: 15, hour: 8, minute: 30 });

function yyyy_mm_dd (date) {
    var now = new Date(date)
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
    return year + "-" + month + "-" + day;
}

function yyyy_mm_dd_hh_mm_ss (date) {
    var now = new Date(date)
    hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
    return yyyy_mm_dd(date) + " " + hour + ":" + minute + ":" + second;
}

yyyy_mm_dd_hh_mm_ss(new Date('2018-08-30 16:53:14').add(1).month())
```

