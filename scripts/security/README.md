# Project security scan

Run from the repository root using Python (`uv`), Shell, or Mage and Docker Desktop in Linux-container mode:

### Python / uv

```bash
uv run python ./scripts/security/scan.py --check-only
uv run python ./scripts/security/scan.py
uv run python ./scripts/security/scan.py --with-ai
```

### Shell

```bash
bash ./scripts/security/scan.sh --check-only
bash ./scripts/security/scan.sh
bash ./scripts/security/scan.sh --with-ai
```

### Mage

```bash
mage AppSecurity
```

The scripts do not install project dependencies, execute project builds, change source, or fix findings. Docker downloads scanner images; scanners download vulnerability databases and public Semgrep rules. npm audit sends dependency metadata to the configured npm registry. Semgrep metrics are disabled. The optional model receives excerpts only at `127.0.0.1:11434`, with proxies bypassed; it has no tools or command execution.

## Coverage and thresholds

| Check | Coverage | Failure condition |
| --- | --- | --- |
| npm audit | Frontend production and development lockfile dependencies | High or critical advisory |
| Trivy | Repository lockfiles, supported dependency formats, Docker/IaC configuration | High or critical finding |
| Semgrep Community Edition | Backend, frontend, scripts; security-audit and OWASP Top Ten rule packs | Any rule finding; parse/rule errors make the run incomplete |
| Gitleaks directory | Working directory, including untracked files subject to Gitleaks exclusions | Any detected secret |
| Gitleaks Git | All locally available Git refs/history | Any detected secret |
| Optional Ollama | Tracked backend `src/main/` and `build.gradle.kts`; frontend `src/` and `scripts/`, subject to filename filters | Advisory only; failed requests make the run incomplete |

Trivy and Semgrep reuse the image digests from `scripts/app-security-audit.sh`. Gitleaks uses the version from `.pre-commit-config.yaml`, pinned to its verified image digest. Public rule packs and vulnerability databases update independently of pinned scanner images. Summary metadata records the commit, dirty state, tool versions, image identities, scope, step statuses, and exit codes.

Reports are saved under ignored `reports/security/<timestamp>-<id>/`. Each scanner has a JSON report and diagnostic log. `summary.json` distinguishes findings from tool failures. Treat reports as private: Gitleaks uses full redaction, but other tools can include source snippets or paths. Do not commit or publish reports without review.

`gitleaks.toml` extends the built-in rules and excludes generated dependencies, build output, internal assistant caches, and reports from both secret scans. Environment files remain in scope for the directory scan.

Exit codes: **0** means completed checks found nothing above their thresholds; **1** means findings; **2** means an incomplete run or tool error. Failed prerequisite checks also terminate with a nonzero exit. All checks continue after individual scanner failures, except unavailable prerequisites. A successful exit is not proof that the project has no vulnerabilities.

## Model setup and review limits

```bash
ollama pull hf.co/mradermacher/Cyber-Ornith-1.5-9B-OBLITERATED-i1-GGUF:Q4_K_M
ollama list
```

Ollama must be running before `--with-ai`. Source review can take hours on a CPU; each request has a 15-minute timeout. The 16K context setting requires additional memory beyond the roughly 5.7 GB model download. There is no automatic whole-repository context or independent verification: model claims remain unverified candidates. The reviewer lists excluded files and oversized lines, skips files over 512 KiB, and checkpoints responses after every excerpt. Filename filtering and secret-line redaction are best effort; they are not a guarantee that all sensitive text is removed. Only use a trusted local Ollama instance.

AI review is limited to `backend/V.T.Thanh-Home-SpringBoot/src/main/`, `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts`, `frontend/V.T.Thanh-Home-Angular/src/`, and `frontend/V.T.Thanh-Home-Angular/scripts/`. Backend tests, frontend tests outside `src/`, repository-level scripts, and `.github/` are outside the AI review scope. Other scanner coverage is unchanged.

Successful AI excerpt reviews are cached in ignored `reports/security/ai-cache/`. Cache keys include the entire file's raw-content hash, file path and numbered excerpt, model name and installed digest, system prompt, and request settings. A change to any of those inputs triggers fresh inference; failures, truncated output, and malformed responses are not cached. Missing or invalid cache entries are reviewed again. The report records cache hits, misses, writes, warnings, and whether each review was reused. Cache writes use temporary files and atomic replacement; a cache write failure does not discard a successful review.

Cached results remain unverified advisory candidates. Changes in other files do not invalidate a file's cached reviews, and cache hits do not represent fresh analysis. Keep the cache private like the reports. To force a fresh AI review, run the reviewer directly with `--no-cache` and a new output directory:

```bash
uv run python scripts/security/review_local.py --output-directory reports/security/manual-review --no-cache
```

Ollama must still be running with the selected model installed, including when cached results are available. The first run populates the cache; subsequent unchanged runs avoid generation requests.

This is a broad automated **static** scan, not an exhaustive security audit. Generated/vendor content and scanner ignore rules limit coverage. Gradle lockfile coverage depends on Trivy support; runtime-resolved artifacts, private registries, containers, production configuration, business logic, authenticated access, and browser behavior need separate validation. A shallow Git clone limits secret history coverage. No application endpoints are probed; this runner does not launch the existing ZAP workflow.

## References

- [Trivy filesystem CLI](https://trivy.dev/docs/latest/references/configuration/cli/trivy_filesystem/)
- [Semgrep CLI and exit codes](https://docs.semgrep.dev/cli-reference)
- [Gitleaks commands and redaction](https://github.com/gitleaks/gitleaks)
- [Ollama generate API](https://docs.ollama.com/api/generate)
- [Cyber-Ornith GGUF model and quantizations](https://huggingface.co/mradermacher/Cyber-Ornith-1.5-9B-OBLITERATED-i1-GGUF)
