package main

import (
	"log"
	"os/exec"
	"time"
)

func CommandExist(command string) bool {
	out, _ := exec.Command("which", command).Output()
	log.Println(command, string(out))
	return len(out) != 0
}

func TimeNow() string {
	return time.Now().Format("20060102150405")
}
