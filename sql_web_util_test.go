package main

import (
	"testing"
)

func TestFirstWord(t *testing.T) {
	if FirstWord("  SELECT ABC FROM DUAL") != "SELECT" {
		t.Error("FIRST WORD of [SELECT ABC FROM DUAL] ERROR")
	}
}
