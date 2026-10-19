package sast

import (
	"regexp"
	"strings"
)

type Severity string

const (
	SeverityCritical Severity = "CRITICAL"
	SeverityHigh     Severity = "HIGH"
	SeverityMedium   Severity = "MEDIUM"
	SeverityLow      Severity = "LOW"
)

type Rule struct {
	ID          string
	Title       string
	OWASP       string
	CWE         string
	ASVS        string
	Severity    Severity
	Extensions  []string
	Scope       string
	Pattern     *regexp.Regexp
	CustomMatch func(line string, context string) bool
	Remediation string
}

func GetRules() []Rule {
	return []Rule{
		{
			ID:          "SAST-SEC-001",
			Title:       "Hardcoded Private Key Detected",
			OWASP:       "A02:2021-Cryptographic Failures",
			CWE:         "CWE-798",
			ASVS:        "V6.4",
			Severity:    SeverityCritical,
			Extensions:  []string{".ts", ".tsx", ".js", ".json", ".env"},
			Scope:       "all",
			Pattern:     regexp.MustCompile(`-----BEGIN (RSA|EC|OPENSSH|PGP|PRIVATE) KEY-----`),
			Remediation: "Remove hardcoded private keys from the codebase and store them in secure environment variables or a vault.",
		},
		{
			ID:          "SAST-SEC-002",
			Title:       "Hardcoded Google / Gemini API Key Detected",
			OWASP:       "A02:2021-Cryptographic Failures",
			CWE:         "CWE-798",
			ASVS:        "V8.2",
			Severity:    SeverityCritical,
			Extensions:  []string{".ts", ".tsx", ".js", ".json"},
			Scope:       "all",
			Pattern:     regexp.MustCompile(`AIza[0-9A-Za-z\-_]{35}`),
			Remediation: "Do not commit API keys to source files. Load them via environment variables.",
		},
		{
			ID:          "SAST-SEC-003",
			Title:       "Hardcoded High-Entropy Secret or Token",
			OWASP:       "A02:2021-Cryptographic Failures",
			CWE:         "CWE-798",
			ASVS:        "V6.4",
			Severity:    SeverityCritical,
			Extensions:  []string{".ts", ".tsx", ".js"},
			Scope:       "all",
			Pattern:     regexp.MustCompile(`(?i)(jwt_secret|api_key|secret_key|private_key)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{24,}['"]`),
			Remediation: "Move credentials and secrets to environment variables or runtime configuration.",
		},
		{
			ID:          "SAST-INJ-001",
			Title:       "Dangerous eval() Execution",
			OWASP:       "A03:2021-Injection",
			CWE:         "CWE-95",
			ASVS:        "V5.2",
			Severity:    SeverityCritical,
			Extensions:  []string{".ts", ".tsx", ".js"},
			Scope:       "all",
			Pattern:     regexp.MustCompile(`\beval\s*\(`),
			Remediation: "Avoid dynamic code execution with eval(). Refactor to safe parsers or lookup dictionaries.",
		},
		{
			ID:          "SAST-XSS-001",
			Title:       "Direct HTML Rendering Sink (dangerouslySetInnerHTML)",
			OWASP:       "A03:2021-Injection",
			CWE:         "CWE-79",
			ASVS:        "V5.1",
			Severity:    SeverityCritical,
			Extensions:  []string{".tsx", ".jsx"},
			Scope:       "web",
			Pattern:     regexp.MustCompile(`dangerouslySetInnerHTML\s*=`),
			Remediation: "Avoid dangerouslySetInnerHTML. If HTML rendering is required, sanitize it thoroughly with DOMPurify.",
		},
		{
			ID:          "SAST-INJ-002",
			Title:       "Dynamic Function Evaluation (new Function)",
			OWASP:       "A03:2021-Injection",
			CWE:         "CWE-95",
			ASVS:        "V5.2",
			Severity:    SeverityHigh,
			Extensions:  []string{".ts", ".tsx", ".js"},
			Scope:       "all",
			Pattern:     regexp.MustCompile(`new\s+Function\s*\(`),
			Remediation: "Do not instantiate dynamic functions from arbitrary strings.",
		},
		{
			ID:          "SAST-CMD-001",
			Title:       "Unsafe Child Process Execution",
			OWASP:       "A03:2021-Injection",
			CWE:         "CWE-78",
			ASVS:        "V5.2",
			Severity:    SeverityHigh,
			Extensions:  []string{".ts", ".js"},
			Scope:       "server",
			Pattern:     regexp.MustCompile(`\b(child_process|cp)\.exec\s*\(`),
			Remediation: "Use execFile or spawn with fixed command arguments instead of exec to avoid shell injection.",
		},
		{
			ID:          "SAST-XSS-002",
			Title:       "Direct DOM innerHTML / outerHTML Assignment",
			OWASP:       "A03:2021-Injection",
			CWE:         "CWE-79",
			ASVS:        "V5.1",
			Severity:    SeverityHigh,
			Extensions:  []string{".ts", ".tsx", ".js"},
			Scope:       "all",
			Pattern:     regexp.MustCompile(`\.(innerHTML|outerHTML)\s*=`),
			Remediation: "Use textContent or standard React data binding to avoid cross-site scripting.",
		},
		{
			ID:          "SAST-XSS-003",
			Title:       "JavaScript Pseudo-Protocol in Link",
			OWASP:       "A03:2021-Injection",
			CWE:         "CWE-79",
			ASVS:        "V5.1",
			Severity:    SeverityHigh,
			Extensions:  []string{".tsx", ".jsx", ".html"},
			Scope:       "web",
			Pattern:     regexp.MustCompile(`href\s*=\s*['"]javascript:`),
			Remediation: "Do not use javascript: URLs. Use event handlers like onClick instead.",
		},
		{
			ID:          "SAST-ENV-001",
			Title:       "Frontend Secret Environment Variable Exposure",
			OWASP:       "A02:2021-Cryptographic Failures",
			CWE:         "CWE-312",
			ASVS:        "V8.2",
			Severity:    SeverityHigh,
			Extensions:  []string{".ts", ".tsx", ".env"},
			Scope:       "web",
			Pattern:     regexp.MustCompile(`VITE_[A-Za-z0-9_]*(SECRET|PRIVATE|PASSWORD)`),
			Remediation: "VITE_ variables are bundled into client-side code. Never store secrets with the VITE_ prefix.",
		},
		{
			ID:          "SAST-CFG-001",
			Title:       "Reverse Tabnabbing (target=_blank without noopener/noreferrer)",
			OWASP:       "A05:2021-Security Misconfiguration",
			CWE:         "CWE-1022",
			ASVS:        "V14.4",
			Severity:    SeverityMedium,
			Extensions:  []string{".tsx", ".jsx", ".html"},
			Scope:       "web",
			CustomMatch: func(line string, context string) bool {
				lower := strings.ToLower(line)
				if strings.Contains(lower, `target="_blank"`) || strings.Contains(lower, `target='_blank'`) {
					ctxLower := strings.ToLower(context)
					if !strings.Contains(ctxLower, "noopener") && !strings.Contains(ctxLower, "noreferrer") {
						return true
					}
				}
				return false
			},
			Remediation: "Add rel=\"noopener noreferrer\" to all links with target=\"_blank\" to prevent window.opener hijacking.",
		},
		{
			ID:          "SAST-CORS-001",
			Title:       "Insecure Wildcard CORS Origin",
			OWASP:       "A05:2021-Security Misconfiguration",
			CWE:         "CWE-942",
			ASVS:        "V14.5",
			Severity:    SeverityMedium,
			Extensions:  []string{".ts", ".js"},
			Scope:       "server",
			Pattern:     regexp.MustCompile(`origin\s*:\s*['"]\*['"]`),
			Remediation: "Explicitly specify allowed origins instead of using a wildcard.",
		},
		{
			ID:          "SAST-LOG-001",
			Title:       "Potential Sensitive Data Exposure in Logs",
			OWASP:       "A09:2021-Security Logging Failures",
			CWE:         "CWE-532",
			ASVS:        "V7.1",
			Severity:    SeverityMedium,
			Extensions:  []string{".ts", ".tsx", ".js"},
			Scope:       "all",
			Pattern:     regexp.MustCompile(`console\.(log|info|warn|error)\(.*?(password|token|secret|apiKey|api_key).*?\)`),
			Remediation: "Avoid logging secrets, passwords, tokens, or sensitive user data in console statements.",
		},
		{
			ID:          "SAST-AUTH-001",
			Title:       "Sensitive Credential Stored in Browser LocalStorage",
			OWASP:       "A07:2021-Identification and Authentication Failures",
			CWE:         "CWE-312",
			ASVS:        "V3.3",
			Severity:    SeverityMedium,
			Extensions:  []string{".ts", ".tsx", ".js"},
			Scope:       "web",
			Pattern:     regexp.MustCompile(`localStorage\.setItem\(.*?(password|secret|private).*?\)`),
			Remediation: "Do not store passwords or secrets in localStorage. Use secure HttpOnly cookies or memory state.",
		},
		{
			ID:          "SAST-SSRF-001",
			Title:       "Potential SSRF from Dynamic URL Interpolation",
			OWASP:       "A10:2021-Server-Side Request Forgery",
			CWE:         "CWE-918",
			ASVS:        "V12.1",
			Severity:    SeverityMedium,
			Extensions:  []string{".ts", ".js"},
			Scope:       "server",
			Pattern:     regexp.MustCompile(`(axios|fetch)\(\s*` + "`" + `http[s]?://\$\{`),
			Remediation: "Validate and whitelist target hostnames before making outbound requests based on external input.",
		},
	}
}
