# Backend validation limits — 26 October 2026

## What

There are **zero surviving needs-validation vulnerability records** and zero unvalidated candidates. The items below are assurance gaps, not vulnerability findings.

The formal security-audit run is incomplete because prescribed CLI file-input safety is unavailable on Windows. The table below distinguishes assurance gaps from vulnerability records; no severity attaches to a generic missing observation.

## Why

Backend source establishes control locations and intended data flow. It does not establish deployed profile/env values, framework behavior under every input, actual database constraints/races, provider responses, current advisories or artifact provenance after deployment.

## How

| Area | Source evidence / exact missing fact | Safe resolution |
|---|---|---|
| Prescribed CLI validation | Unchanged validators fail: `OS no-follow and nonblocking input protection is unavailable`. Exported functions check structure only. | Run the prescribed validators in an environment supporting their protections. Preserve no-follow and input/resource limits. |
| Production challenge policy | Production Compose line 30 defaults verification off; production YAML defaults it on. Actual launch path and override are unknown. | Owner inspects existing launch configuration and chosen policy. Use mocked enabled-mode verification for missing/expired token, wrong action/hostname, missing keys and provider failure; no real provider request. |
| Session/CSRF and route attachment | ADMIN/Actuator rules, CSRF repository, session-ID rotation and invalidation are source-visible. Actual cookie/header exchange and deployed attachment are not observed. | Isolated mock/browser fixtures with dummy accounts; owner inspects profile, TLS/proxy and existing deployment metadata. |
| DB ownership, idempotency and races | Conversation visitor checks, visitor-scoped contact keys, unique indexes, versions and worker claims were traced. Actual migrations/database state and concurrent outcomes were not tested. | Disposable PostgreSQL under complete containment, dummy principals and bounded schedules. Never point existing destructive test setup at shared state. |
| Quotas, cancellation and replicas | Counters/windows/concurrency are process-local. Actual instance count, restart behavior, proxy peer identities and total provider spend are unknown. | Owner inspects topology; isolated two-client/two-process fixtures establish only the intended budget contract. No saturation or paid calls. |
| Dependencies/build/deployment | Build, locks and Docker inputs inspected; no current advisory database, dependency integrity check or emitted-artifact inspection. | Assess advisories with a trusted dataset and applicability review. Build only offline with already-present tools/dependencies inside the complete sandbox. |
| Knowledge/provider permissions | Knowledge URL is operator-configured; fixed provider clients use server credentials. Actual source ownership, content and credential privileges are unobserved. | Owner checks intended public knowledge provenance and credential scope. Mock responses/redirects for local validation; no real secrets or provider calls. |

Existing tests are source evidence, not passing results. Some use `deleteAll()`; their `TEST_DATABASE_*` settings can be overridden. A test initializer's name does not establish ambient safety.

Execution requires all skill controls: no external network; empty allowlisted environment; target/toolchain read-only; scratch-only writes; explicit CPU, memory, process, file-size, disk and time limits. Runtime evidence promotion requires trusted race-safe file handling. These capabilities were not assumed or bypassed.

## When

Resolve the formal CLI blocker and relevant assurance gaps before relying on a broader release-security claim. See [REPORT.md](REPORT.md) for source findings/hardening and [COVERAGE.md](COVERAGE.md) for owned source checks.
