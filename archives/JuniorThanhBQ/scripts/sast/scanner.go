package sast

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

type Finding struct {
	Rule       Rule
	FilePath   string
	LineNumber int
	Line       string
}

type ScanResult struct {
	FilesScanned int
	Findings     []Finding
}

func Scan() (*ScanResult, error) {
	rules := GetRules()
	result := &ScanResult{}

	targets := []struct {
		root  string
		scope string
	}{
		{root: "server/src", scope: "server"},
		{root: "web/src", scope: "web"},
		{root: "web/index.html", scope: "web"},
		{root: ".env", scope: "all"},
	}

	for _, target := range targets {
		info, err := os.Stat(target.root)
		if err != nil {
			continue
		}

		if !info.IsDir() {
			scanFile(target.root, target.scope, rules, result)
			continue
		}

		err = filepath.Walk(target.root, func(path string, fi os.FileInfo, err error) error {
			if err != nil {
				return nil
			}

			if fi.IsDir() {
				name := fi.Name()
				if name == "node_modules" || name == "dist" || name == ".git" || name == ".vercel" || name == "coverage" {
					return filepath.SkipDir
				}
				return nil
			}

			scanFile(path, target.scope, rules, result)
			return nil
		})

		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func scanFile(filePath string, scope string, rules []Rule, result *ScanResult) {
	ext := filepath.Ext(filePath)
	result.FilesScanned++

	file, err := os.Open(filePath)
	if err != nil {
		return
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	totalLines := len(lines)
	for i, line := range lines {
		lineNum := i + 1

		for _, rule := range rules {
			if rule.Severity == SeverityLow {
				continue
			}

			if rule.Scope != "all" && rule.Scope != scope {
				continue
			}

			matchedExt := false
			for _, e := range rule.Extensions {
				if e == ext || (e == ".env" && strings.HasSuffix(filePath, ".env")) {
					matchedExt = true
					break
				}
			}
			if !matchedExt {
				continue
			}

			matched := false
			if rule.CustomMatch != nil {
				start := i - 3
				if start < 0 {
					start = 0
				}
				end := i + 4
				if end > totalLines {
					end = totalLines
				}
				context := strings.Join(lines[start:end], "\n")
				matched = rule.CustomMatch(line, context)
			} else if rule.Pattern != nil {
				matched = rule.Pattern.MatchString(line)
			}

			if matched {
				cleanLine := strings.TrimSpace(line)
				if len(cleanLine) > 160 {
					cleanLine = cleanLine[:160] + "..."
				}

				result.Findings = append(result.Findings, Finding{
					Rule:       rule,
					FilePath:   filepath.ToSlash(filePath),
					LineNumber: lineNum,
					Line:       cleanLine,
				})
			}
		}
	}
}
