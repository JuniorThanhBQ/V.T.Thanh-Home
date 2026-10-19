package utils

import (
	"os"
	"os/exec"
)

func RunCmd(cmdName string, args ...string) error {
	cmd := exec.Command(cmdName, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func RunCmdIgnoreError(cmdName string, args ...string) {
	cmd := exec.Command(cmdName, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	_ = cmd.Run()
}
