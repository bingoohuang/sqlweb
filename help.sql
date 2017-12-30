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
  COLUMN_NAME