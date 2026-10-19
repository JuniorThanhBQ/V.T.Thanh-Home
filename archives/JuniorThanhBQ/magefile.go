//go:build mage
// +build mage

package main

import (
	"juniorthanhbq/scripts/build"
	"juniorthanhbq/scripts/deps"
	"juniorthanhbq/scripts/embed"
	"juniorthanhbq/scripts/lint"
	"juniorthanhbq/scripts/runner"
	"juniorthanhbq/scripts/sast"
)

func InstallDeps() error {
	return deps.Run()
}

func UpdateDeps() error {
	return deps.Update()
}

func Build() error {
	return build.Run()
}

func Lint() error {
	return lint.Run()
}

func Run() error {
	return runner.Run()
}

func Embed() error {
	return embed.Run()
}

func Sast() error {
	return sast.Run()
}
