# go-sql-web
sql web based on golang


# build
1. install golang 1.11+
1. `go get -u -v github.com/jteeuwen/go-bindata/...`
2. `go get -u -v golang.org/x/tools/cmd/goimports`
3. git clone git@github.com:bingoohuang/go-sql-web.git & cd go-sql-web
3. `./gobin.sh ; go mod tidy ; go build -x -v` 
5. build for linux :`env GOOS=linux GOARCH=amd64 go build -o go-sql-web.linux.bin`

# docker
```sh
docker run -d \
 --name go-sql-web \
 --restart=always \
 --rm \
 -p 8381:8381 \
 -v $(pwd)/appConfig.toml:/root/appConfig.toml:ro \
 registry.cn-hangzhou.aliyuncs.com/bingoo-docker/go-sql-web
```


# center database tables for multiple-tenant databases

```sql
CREATE TABLE `tr_f_db` (
  `MERCHANT_ID` bigint(20) NOT NULL COMMENT '商户ID',
  `DB_NAME` varchar(50) NOT NULL COMMENT '数据库名',
  `DB_USERNAME` varchar(50) NOT NULL COMMENT '用户名',
  `DB_PASSWORD` varchar(100) NOT NULL COMMENT '用户密码',
  `INSTANCE_ID` varchar(100) NOT NULL COMMENT '实例ID',
  `PROXY_IP` varchar(100) NOT NULL COMMENT '应用接入数据库的IP。',
  `PROXY_PORT` varchar(100) NOT NULL COMMENT '应用端口号',
  `STATE` char(1) NOT NULL COMMENT '1-空闲；2-在用',
  PRIMARY KEY (`MERCHANT_ID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '数据库信息';

CREATE TABLE `tr_f_merchant` (
  `MERCHANT_ID` varchar(36) NOT NULL COMMENT '商户ID',
  `MERCHANT_NAME` varchar(50) NOT NULL COMMENT '商户名称',
  `MERCHANT_CODE` varchar(20) DEFAULT NULL COMMENT '商户code',
  `HOME_AREA` varchar(15) NOT NULL DEFAULT '部署中心',
  `CLASSIFIER` varchar(45) not null DEFAULT 'default',
  PRIMARY KEY (`MERCHANT_ID`),
  UNIQUE KEY `MERCHANT_CODE` (`MERCHANT_CODE`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '商户信息';
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

## UPX
[Citing: ](https://grahamenos.com/rust-osx-linux-musl.html)If you’re concerned about the binary size of your new executable, check out UPX. After installing it on my laptop via brew install upx, I ran upx -9 on an executable created with the above instructions. While the executable was an overly simplistic example, upx compressed it down to 34% of the original size. Even if you don’t care about the size of the binary once it’s on the server, it at least made the scp go faster.


# Some useful javascript snippet
## date-fns

```javascript
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdn.bootcss.com/date-fns/1.30.1/date_fns.min.js';
document.head.appendChild(script);

dateFns.parse('20090131')
dateFns.startOfWeek(dateFns.parse('20090131'))

dateFns.format(dateFns.addHours(dateFns.parse('20090131'), 8), 'YYYY-MM-DD HH:mm:ss')

```

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

