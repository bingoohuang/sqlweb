package main

import (
	"compress/gzip"
	"io"
	"net/http"
	"strings"
	"unicode"
)

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func gzipWrapper(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			fn(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		gzr := gzipResponseWriter{Writer: gz, ResponseWriter: w}
		fn(gzr, r)
	}
}

func authOk(r *http.Request) bool {
	if !writeAuthRequired {
		return true
	}

	loginCookie := readLoginCookie(r)
	if loginCookie != nil && loginCookie.Name != "" {
		return true
	}

	return false
}

func FirstWord(value string) string {
	started := -1
	ended := 0
	// Loop over all indexes in the string.
	for i, c := range value {
		// If we encounter a space, reduce the count.
		if started == -1 && !unicode.IsSpace(c) {
			started = i
		}
		if started >= 0 && unicode.IsSpace(c) {
			ended = i
			break
		}
	}
	// Return the entire string.
	return value[started:ended]
}
