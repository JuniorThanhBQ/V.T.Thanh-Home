# Backend source security review — 26 October 2026

## What

**Source inspection result: zero confirmed vulnerabilities and zero surviving vulnerability candidates.** This is a backend-scoped static review, with partial system coverage; it does not establish deployed security. The formal security-audit workflow remains **INCOMPLETE** because the prescribed CLI validators require OS no-follow/nonblocking input protections unavailable in this Windows environment. The unchanged validators' exported functions provide additional structural checks, not replacement CLI safety.

The reviewed controls, coverage dispositions and remaining assurance gaps are detailed below.

| Item | Scope / evidence |
|---|---|
| Inspection dates | Started 25 October; resumed and reported 26 October 2026, Asia/Saigon |
| Original source reference | `43df4e21835809be9dd9698a91aff036f6403f12` |
| Resumed repository reference | `697145093e857cbc2fe5bb0a4fe3db50fa566353`; backend and Compose source unchanged from the original reference |
| Profile / budget | Standard; no invocation budget specified |
| Scope | Backend Java, tests, SQL migrations, resources, build/configuration, Dockerfile and documentation; root development/production Compose files as backend deployment glue |
| Source inventory | 111 authored text/configuration files, including 88 Java files |
| Exclusions | Generated `bin/` and build/cache/report output, wrapper JAR execution/analysis, env/secret contents, archives, root CI/release workflows, frontend re-audit, providers and deployed state |
| Prior review | Frontend run-1 had no vulnerability records; its backend out-of-scope unit became current backend work |
| Application stack | Build declares Spring Boot **4.1.1**, Java **25**, Gradle **9.8.1**, release **1.0.2** |

The quota interruption did not invalidate the saved source reviews: both Git comparison and saved source hashes showed no backend/Compose changes. No prior frontend coverage was used as a substitute for backend inspection.

Only audit Markdown is created or updated in the repository. Application source, configuration, dependencies, migrations and tests are unchanged. Machine-readable bookkeeping is outside the repository at `C:/Users/hp/security-audit-skill/V.T.Thanh-Home/run-2`.

See [coverage evidence](COVERAGE.md), [finding details](FINDINGS-DETAIL.md), [validation limits](NEEDS-VALIDATION.md), [architecture](architecture.md), and the [frontend follow-up](../frontend-2026-10-25/BACKEND-FOLLOW-UP.md).

## Why

The review traced lower-trust input through identity, authorization, validation, queries, stored copies, asynchronous processing and provider calls. A finding required a concrete affected principal/resource and boundary result. Unexecuted test assertions, optional hardening and unknown deployment settings were not elevated into confirmed vulnerabilities.

### Positive source patterns

- **Authorization is enforced in backend configuration.** [route policy:41](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/config/SecurityConfig.java:41) permits specific public routes, protects admin and non-health Actuator routes with ADMIN, and denies unmatched requests. A public frontend admin route or broad Actuator proxy is not itself a backend authorization bypass.
- **CSRF integration is explicit.** [CSRF configuration:34](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/config/SecurityConfig.java:34) uses a cookie token repository and request handler matching the frontend's retained XSRF mechanism. This resolves source presence, not the browser/proxy exchange.
- **Login/logout manage the server session.** [authentication:53](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/AdminAuthService.java:53) checks an active account/password; existing session IDs rotate before ADMIN context is stored, and logout invalidates the session. Passwords use SHA-256/Base64 prehashing followed by BCrypt.
- **Visitor and conversation identity are server-selected.** [visitor checks:56](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/VisitorService.java:56) resolves the session-held visitor and rechecks blocking. [conversation ownership:170](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/ChatService.java:170) binds a session token to that visitor; caller token selection is rejected at controller/DTO boundaries.
- **Publication filters exist on both public paths.** [blog queries:31](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/BlogService.java:31) require PUBLISHED, while [project queries:22](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/ProjectService.java:22) require published=true. Admin access uses separate role-protected paths.
- **Contact state is scoped.** [submission path:40](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/ContactService.java:40) validates fields, applies limits/challenge checks, and scopes idempotency to visitor plus key. The mail path uses a fixed operator recipient, encoded subject/plain-text body, fixed Google endpoints and bounded worker claims/attempts.
- **Chat cost controls are present.** [generation path:58](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/ChatService.java:58) includes message/request-ID bounds, one in-flight message per visitor, two generation slots, request windows and a synchronized UTC daily process budget. Provider context/output and key attempts are bounded; no model tool executor was found.

These are inspected controls and source traces. They do not prove that production runs this artifact, that active profile/env values are safe, or that every framework, database, concurrency or provider behavior matches the source assumptions.

## How

### Findings

**Zero confirmed vulnerabilities, zero surviving needs-validation vulnerability records, zero rejected records and zero unvalidated candidates.** This result is limited to the enumerated source checks and does not establish that the deployed backend is secure.

| Severity | Finding | Demonstrated result |
|---|---|---|
| — | No confirmed records | No runtime exploit or cross-principal failure demonstrated |

**NEEDS VALIDATION vulnerability records:** none. The validation document tracks assurance gaps separately; they are not assigned severity.

### Hardening and configuration observations

These items have **no vulnerability severity**. They describe source-visible policy differences or assurance work; no exploit or confidential-data disclosure was demonstrated.

| When | Observation and significance | Smallest follow-up |
|---|---|---|
| Before the next production start/configuration change | Production Compose supplies `TURNSTILE_ENABLED` with a false default, while the production YAML uses a true default. With no operator override, that Compose path disables challenge verification. The backend guide already documents this difference; other quotas remain and the live setting is unobserved. | Decide the production challenge policy explicitly and align deployment defaults. If enabling verification, supply valid keys/hostnames; enabled mode fails closed when keys are missing. |
| Before adopting a deployment-wide cost guarantee | Daily chat budget, quotas and concurrency state are process-local and reset with processes. No attacker-controlled reset or observed overspend was established. | Document the per-process guarantee; use shared accounting only if the intended policy must span replicas/restarts, and test it with dummy state. |
| When maintaining project writes | Project service validation is less complete than blog validation and the frontend editor; the writer is already the global administrator. No lower-trust exploit path was found. | Apply explicit server-side slug, URL, length/order and technology-list rules when relying on those constraints. Keep legitimate administrator inputs working. |
| Before promising mandatory stale-editor rejection | Blog/project services compare a submitted version only when present. Entity `@Version` still protects competing database transactions, but an omitted client version does not enforce a stale-client contract. | Require a version if that contract is intended, and test missing, stale and concurrent cases. |
| Before introducing account-disable/password-change workflows | Active account state is checked at login, and bootstrap creates only a missing configured account. No immediate session-revocation contract or account-management endpoint was found. | Define rotation/revocation semantics explicitly; do not assume changing a bootstrap environment password rotates an existing database account or every session. |
| Before relying on hosted IP quotas | Limiters use transport `getRemoteAddr()`. Actual proxy normalization determines whether that identifies the intended client. | Inspect the trusted-proxy configuration and use an isolated two-client fixture. Do not trust arbitrary caller forwarding headers. |

Key configuration evidence: [production Compose:30](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/docker-compose.prod.yml:30) versus [production defaults:1](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/resources/application-prod.yaml:1); disabled/enabled behavior is at [verification gate:47](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/TurnstileVerificationService.java:47). Process budget: [daily accounting:158](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/ChatService.java:158). Optional versions: [blog update:96](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/BlogService.java:96) and [project update:82](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/ProjectService.java:82). Bootstrap behavior: [account bootstrap:29](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/AdminBootstrapService.java:29). Peer identity: [client IP:70](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/service/VisitorService.java:70).

### Validation and coverage

The four focused reviewers completed 11 source units; 1 retain blocked stronger-assurance coverage, 0 are candidates and 0 are deferred. Three units explicitly exclude frontend re-audit, archives and root CI. The check union covers all 111 authored files. The post-wave critic and distinct final-clean critic each accepted no missing source units or reassignments.

Four reconnaissance roles and four focused review roles were used, with two independent coverage critics. The interrupted operations review resumed with a fresh reviewer. No invocation budget was set. No candidate survived, so candidate and final-record verification had zero records to process.

Existing test source includes authentication/CORS/CSRF, visitor, content, contact, chat and limiter fixtures. **Tests were read, not run.** Several integration fixtures delete database rows, so their defaults are not permission to execute against a shared or ambiently configured database.

No application, test, build, browser, dependency installer or provider request was executed. No runtime artifact or exploit result is claimed. Current dependency advisories, resolved-package integrity, emitted artifacts, database state and deployed response/cookie/proxy behavior remain unverified. Generated class/resource copies under `bin/` were inventoried but excluded from reviewed source; Docker selects `src/main`.

The prescribed CLI gates were attempted and retain their platform failure. Exported ledger/findings structural checks are reported separately. A completed source-path inspection does not imply a completed exact skill workflow or exhaustive security coverage.

## When

Resolve the CLI platform blocker before claiming completion of the exact security-audit workflow. Runtime tests additionally require the skill's full no-network, empty-environment, read-only, scratch-confined and resource-bounded sandbox plus safe retained-artifact promotion.

Prioritize the production challenge default and effective profile/proxy/cookie settings before the next deployment. Add focused regressions for enabled Turnstile failures/action/hostname binding, session-ID rotation and revocation, cross-visitor idempotency/ownership, worker claims, and quota rollover/cancellation. Preserve intended behavior in any future fix.

The frontend report receives a dated source-evidence follow-up. Its historical frontend-only result remains intact; production/runtime and frontend dependency/renderer assurance are not retroactively marked validated.
