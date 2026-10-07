//go:build mage
// +build mage

package main

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/magefile/mage/sh"
)

func run(name string, args ...string) error {
	cmd := exec.Command(name, args...) // nosemgrep: go.lang.security.audit.dangerous-exec-command.dangerous-exec-command
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	return cmd.Run()
}

func AppAudit() error {
	return run("bash", "scripts/app-security-audit.sh")
}

func BackendLockfile() error {
	return run("bash", "scripts/app-backend-lockfile.sh")
}

func Build() error {
	return run("bash", "scripts/app-build.sh")
}

func BuildBackend() error {
	return run("bash", "scripts/app-build.sh", "--backend")
}

func BuildFrontend() error {
	return run("bash", "scripts/app-build.sh", "--frontend")
}

func Clean() error {
	return run("bash", "scripts/app-clean.sh")
}

func CleanAll() error {
	return run("bash", "scripts/app-clean.sh", "--all")
}

func Lint() error {
	return run("bash", "scripts/app-lint.sh")
}

func PreCommit() error {
	return run("bash", "scripts/pre-commit-check.sh")
}

func PreCommitUpdate() error {
	return run("bash", "scripts/pre-commit-check.sh", "--update")
}

func Translate() error {
	return run("uv", "run", "python", "scripts/frontend/app-vi-multi-lang-translation.py")
}

func SecretGenerate() error {
	if err := sh.RunV("bash", "scripts/app-secret-generate.sh"); err != nil {
		return fmt.Errorf("failed to generate secrets: %w", err)
	}

	return nil
}

func Setup() error {
	return run("bash", "scripts/app-setup.sh")
}
