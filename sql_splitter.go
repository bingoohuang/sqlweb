package main

import (
	"strings"
	"unicode/utf8"
)

func SplitSubSqls(sqls string) []string {
	subSqls := make([]string, 0)

	inQuoted := false
	pos := 0
	len := len(sqls)

	for i, w := 0, 0; i < len; i += w {
		runeValue, width := utf8.DecodeRuneInString(sqls[i:])
		w = width

		var nextRuneValue rune
		nextWidth := 0
		if i+w < len {
			nextRuneValue, nextWidth = utf8.DecodeRuneInString(sqls[i+w:])
		}

		jumpNext := false

		if runeValue == '\\' {
			jumpNext = true
		} else if runeValue == '\'' {

			if inQuoted && nextWidth > 0 && nextRuneValue == '\'' {
				jumpNext = true // jump escape for literal apostrophe, or single quote
			} else {
				inQuoted = !inQuoted
			}
		} else if !inQuoted && runeValue == ';' {
			subSqls = tryAddSql(subSqls, sqls[pos:i])
			pos = i + w
		}

		if jumpNext {
			i += w + nextWidth
		}
	}

	if pos < len {
		subSqls = tryAddSql(subSqls, sqls[pos:])
	}

	return subSqls
}

func tryAddSql(sqls []string, sql string) []string {
	s := strings.TrimSpace(sql)
	if s != "" {
		sqls = append(sqls, s)
	}

	return sqls
}
