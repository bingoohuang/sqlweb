#!/usr/bin/env bash


nohup ./go-sql-web.linux.bin -port=8381 -dataSource="user:pass@tcp(abc.mysql.com:3306)/xxx?charset=utf8" -key=1234EFFC3121F935 -cookieName=sqlwebdemo -corpId=corpId -corpSecret=corpSecret
Yhore46QK1YpFT0mGgDmghUAeIRFnoa3MZ3vE -agentId=1000002 -redirectUri=http://redirect.url.cn  > go-sql-web.out 2>&1 &