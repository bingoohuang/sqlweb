package main

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestSplitSql(t *testing.T) {
	assert := assert.New(t)

	sql := "create table aaa; drop table aaa;"
	sqls := SplitSubSqls(sql)

	assert.Equal([]string{"create table aaa", "drop table aaa"}, sqls)
}

func TestSplitSql2(t *testing.T) {
	assert := assert.New(t)

	sql := "ADD COLUMN `PREFERENTIAL_WAY` CHAR(3) NULL COMMENT '优\\惠方式:0:现金券;1:减免,2:赠送金额 ;' AFTER `PAY_TYPE`;"
	sqls := SplitSubSqls(sql)

	assert.Equal([]string{"ADD COLUMN `PREFERENTIAL_WAY` CHAR(3) NULL COMMENT '优\\惠方式:0:现金券;1:减免,2:赠送金额 ;' AFTER `PAY_TYPE`"}, sqls)
}

func TestSplitSql3(t *testing.T) {
	assert := assert.New(t)

	sql := "ALTER TABLE `tt_l_mbrcard_chg`; \n" +
		"ADD COLUMN `PREFERENTIAL_WAY` CHAR(3) NULL COMMENT '优惠方式:''0:现金券;1:减免,2:赠送金额 ;' AFTER `PAY_TYPE`; "
	sqls := SplitSubSqls(sql)

	assert.Equal([]string{"ALTER TABLE `tt_l_mbrcard_chg`",
		"ADD COLUMN `PREFERENTIAL_WAY` CHAR(3) NULL COMMENT '优惠方式:''0:现金券;1:减免,2:赠送金额 ;' AFTER `PAY_TYPE`"}, sqls)
}
