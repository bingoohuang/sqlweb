package sqlweb

import "strings"

// IsQuerySQL tests a sql is a query or not.
func IsQuerySQL(sql string) (string, bool) {
	key := FirstWord(sql)

	switch strings.ToUpper(key) {
	case "SELECT", "SHOW", "DESC", "DESCRIBE", "EXPLAIN", "WITH":
		return key, true
	default: // "INSERT", "DELETE", "UPDATE", "SET", "REPLACE":
		return key, false
	}
}

// FirstWord returns the first word of the SQL statement s.
func FirstWord(s string) string {
	if fields := strings.Fields(strings.TrimSpace(s)); len(fields) > 0 {
		return fields[0]
	}

	return ""
}
