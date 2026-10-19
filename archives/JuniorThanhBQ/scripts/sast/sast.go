package sast

import "fmt"

func Run() error {
	fmt.Println("Running SAST Security Scanner across server and web...")

	result, err := Scan()
	if err != nil {
		return fmt.Errorf("scan execution failed: %w", err)
	}

	criticalCount, highCount, mediumCount := PrintConsoleReport(result)

	if err := GenerateMarkdownReport(result, criticalCount, highCount, mediumCount); err != nil {
		fmt.Printf("Warning: Failed to generate markdown report: %v\n", err)
	}

	if criticalCount > 0 || highCount > 0 {
		return fmt.Errorf("SAST scan failed with %d critical and %d high findings. Review reports/sast-report.md", criticalCount, highCount)
	}

	fmt.Println("\nSAST Security Scan PASSED (No Critical or High issues found).")
	return nil
}
