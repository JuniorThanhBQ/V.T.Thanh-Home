package sast

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func PrintConsoleReport(result *ScanResult) (int, int, int) {
	criticalCount := 0
	highCount := 0
	mediumCount := 0

	fmt.Println("\n========================================================")
	fmt.Println("             SAST STATIC SECURITY SCAN                  ")
	fmt.Println("       Standards: OWASP Top 10 | CWE | OWASP ASVS       ")
	fmt.Println("========================================================")
	fmt.Printf("Files Scanned: %d\n\n", result.FilesScanned)

	for _, f := range result.Findings {
		switch f.Rule.Severity {
		case SeverityCritical:
			criticalCount++
			fmt.Printf("\033[31m[CRITICAL]\033[0m %s\n", f.Rule.Title)
		case SeverityHigh:
			highCount++
			fmt.Printf("\033[35m[HIGH]\033[0m %s\n", f.Rule.Title)
		case SeverityMedium:
			mediumCount++
			fmt.Printf("\033[33m[MEDIUM]\033[0m %s\n", f.Rule.Title)
		default:
			continue
		}

		fmt.Printf("  Location:    %s:%d\n", f.FilePath, f.LineNumber)
		fmt.Printf("  Standards:   [%s] [%s] [ASVS %s]\n", f.Rule.OWASP, f.Rule.CWE, f.Rule.ASVS)
		fmt.Printf("  Code:        %s\n", f.Line)
		fmt.Printf("  Remediation: %s\n\n", f.Rule.Remediation)
	}

	fmt.Println("--------------------------------------------------------")
	fmt.Printf("Total Findings: %d (Critical: %d, High: %d, Medium: %d)\n",
		criticalCount+highCount+mediumCount, criticalCount, highCount, mediumCount)
	fmt.Println("--------------------------------------------------------")

	return criticalCount, highCount, mediumCount
}

func GenerateMarkdownReport(result *ScanResult, criticalCount, highCount, mediumCount int) error {
	if err := os.MkdirAll("reports", 0755); err != nil {
		return err
	}

	reportPath := filepath.Join("reports", "sast-report.md")
	f, err := os.Create(reportPath)
	if err != nil {
		return err
	}
	defer f.Close()

	statusText := "PASSED"
	if criticalCount > 0 || highCount > 0 {
		statusText = "FAILED"
	}

	fmt.Fprintf(f, "# SAST Security Scan Report\n\n")
	fmt.Fprintf(f, "- **Generated At**: %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Fprintf(f, "- **Scan Status**: **%s**\n", statusText)
	fmt.Fprintf(f, "- **Files Scanned**: %d\n", result.FilesScanned)
	fmt.Fprintf(f, "- **Threshold Policy**: Skip LOW, display MEDIUM (pass), fail on CRITICAL / HIGH\n\n")

	fmt.Fprintf(f, "## Summary\n\n")
	fmt.Fprintf(f, "| Severity | Count | Threshold Action |\n")
	fmt.Fprintf(f, "|---|---|---|\n")
	fmt.Fprintf(f, "| CRITICAL | %d | Block build |\n", criticalCount)
	fmt.Fprintf(f, "| HIGH | %d | Block build |\n", highCount)
	fmt.Fprintf(f, "| MEDIUM | %d | Informational (Pass) |\n", mediumCount)
	fmt.Fprintf(f, "| LOW | Skipped | Omitted |\n\n")

	fmt.Fprintf(f, "## Detailed Findings\n\n")

	if len(result.Findings) == 0 {
		fmt.Fprintf(f, "No vulnerabilities found matching active rules.\n\n")
	} else {
		for i, finding := range result.Findings {
			if finding.Rule.Severity == SeverityLow {
				continue
			}

			fmt.Fprintf(f, "### %d. [%s] %s\n\n", i+1, finding.Rule.Severity, finding.Rule.Title)
			fmt.Fprintf(f, "- **Rule ID**: `%s`\n", finding.Rule.ID)
			fmt.Fprintf(f, "- **OWASP Top 10**: `%s`\n", finding.Rule.OWASP)
			fmt.Fprintf(f, "- **CWE**: `%s`\n", finding.Rule.CWE)
			fmt.Fprintf(f, "- **OWASP ASVS**: `%s`\n", finding.Rule.ASVS)
			fmt.Fprintf(f, "- **Location**: [`%s:%d`](../%s#L%d)\n\n", finding.FilePath, finding.LineNumber, finding.FilePath, finding.LineNumber)
			fmt.Fprintf(f, "```typescript\n%s\n```\n\n", finding.Line)
			fmt.Fprintf(f, "**Remediation**:\n%s\n\n---\n\n", finding.Rule.Remediation)
		}
	}

	fmt.Printf("SAST Markdown report generated at: %s\n", reportPath)
	return nil
}
