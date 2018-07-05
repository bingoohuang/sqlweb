CREATE TABLE `tr_f_merchant` (
  `MERCHANT_ID` varchar(36) NOT NULL COMMENT '商户ID',
  `MERCHANT_NAME` varchar(50) NOT NULL COMMENT '商户名称',
  `MERCHANT_CODE` varchar(20) DEFAULT NULL COMMENT '商户code',
  `HOME_AREA` varchar(15) NOT NULL DEFAULT '部署中心',
  `CLASSIFIER` varchar(45) DEFAULT 'yoga',
  PRIMARY KEY (`MERCHANT_ID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '商户信息';


CREATE TABLE `tr_f_db` (
  `MERCHANT_ID` varchar(36) NOT NULL COMMENT '商户ID',
  `DB_NAME` varchar(50) NOT NULL COMMENT '数据库名【密文】',
  `DB_USERNAME` varchar(50) NOT NULL COMMENT '用户名【密文】',
  `DB_PASSWORD` varchar(100) NOT NULL COMMENT '用户密码【密文】',
  `INSTANCE_ID` varchar(100) NOT NULL COMMENT '实例ID',
  `PROXY_IP` varchar(100) NOT NULL COMMENT '应用接入数据库的IP。PROXY代理给出的',
  `PROXY_PORT` varchar(100) NOT NULL COMMENT '应用端口号',
  `STATE` char(1) NOT NULL COMMENT '0-未创建；1-空闲（已创建，未分配）；2-在用（已分配给商户）；3-停用；4-销户；',
  PRIMARY KEY (`MERCHANT_ID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '数据库信息';

select
  *
from
  INFORMATION_SCHEMA.COLUMNS
where
  TABLE_SCHEMA not in('information_schema', 'mysql', 'performance_schema')
  and DATA_TYPE not in ('text', 'datetime', 'int', 'tinyint', 'char', 'decimal')
  and (CHARACTER_MAXIMUM_LENGTH is null or CHARACTER_MAXIMUM_LENGTH < 100)
  and COLUMN_DEFAULT is null
  and COLUMN_COMMENT NOT REGEXP '.*(状态|图片|url|图像|类型|类别|哪些|方式|备注|弃用|废弃|内容|描述|有效期|地址).*'
  and COLUMN_NAME in (
    select
      COLUMN_NAME
    from
      (
        select
          COLUMN_NAME,
          count(*)
        from
          INFORMATION_SCHEMA.COLUMNS
        where
          TABLE_SCHEMA not in('information_schema', 'mysql', 'performance_schema')
          and DATA_TYPE not in ('text', 'datetime', 'int', 'tinyint', 'char', 'decimal')
          and COLUMN_DEFAULT is null
          and COLUMN_NAME not in ('CREATE_TIME', 'UPDATE_TIME', 'STATE', 'REMARK')
        group by
          COLUMN_NAME
        having
          count(*) > 1
      ) cols
  )
order by
  COLUMN_NAME;