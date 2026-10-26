# Frontend validation limits — 25 October 2026

**Backend follow-up — 26 October 2026:** Backend authorization, CSRF/session, ownership, publication, idempotency and challenge controls have now been inspected at source level. Read [BACKEND-FOLLOW-UP.md](BACKEND-FOLLOW-UP.md) for the evidence and remaining limits. Statements below that backend implementation had not yet been reviewed describe the historical 25 October scope; runtime/deployment and CLI-validation gaps remain unresolved.

## What

There are **zero surviving `needs_validation` vulnerability records** and zero unvalidated vulnerability candidates.

The following items are assurance gaps and future validation work. They have no vulnerability severity. The formal skill run is incomplete because both prescribed CLI validators require OS file-opening protections unavailable in this Windows Node environment.

## Why

Source inspection establishes what the frontend requests, renders and declares. It cannot establish remote enforcement, browser behavior under every input, effective hosting configuration, current dependency advisories, or provider quotas. A missing observation without a sufficiently supported boundary-failure hypothesis was kept as a coverage limit.

## How

| Area | Source evidence | Exact missing fact | Bounded resolution |
|---|---|---|---|
| Formal validator gate | Skill CLI invocations fail with `OS no-follow and nonblocking input protection is unavailable` | Successful prescribed CLI validation under supported file-safety semantics | Run the unchanged skill validators against the parent-generated records in a compatible environment. Preserve input limits and no-follow protections. Pure exported functions have already checked structure; do not equate that with CLI success. |
| Dependency/build coverage — blocked | `package.json`, `package-lock.json`, `angular.json`, public assets | Current advisory applicability, installed package integrity and actual emitted production assets | Use a trusted current advisory dataset in an owner-approved process; review applicability and deployed use before assigning severity. An offline build/output check requires the complete sandbox and already-present dependencies. |
| Deployment/cache coverage — blocked | `vercel.json:13-43,150-191`; `api/viewers.ts:53` | Effective header/rewrite/cache precedence, private-response behavior and backend management authorization | Owner inspects hosting configuration, existing response metadata/logs and backend policy. Use isolated dummy proxy/cache fixtures for behavioral checks. Do not send audit probes to a deployment. |
| Markdown browser behavior | `markdown.pipe.ts:17-68`; blog template line 57; chat template line 162 | Actual final Angular DOM for representative malformed and allowed inputs | In a fully isolated browser fixture, use dummy blog/bot strings; assert no executable attributes/URLs and verify legitimate links/images/tables still work. Do not use private content or production users. |
| Admin/session integration | `admin.service.ts:70-124,245-298`; `app.config.ts:15` | Server authorization, cookie/header binding, session rotation/revocation and lifecycle behavior | A later authorized backend source review checks enforcement. A mocked frontend HttpClient fixture can schedule stale checks, 401/403, pending writes, successful logout and failed logout without contacting a real backend. |
| Public submission enforcement | Contact/chat services; `turnstile.service.ts:16-85` | Server treatment of missing/expired challenge tokens, visitor identity, quotas and request/idempotency identifiers | Later backend source review plus isolated dummy-data service tests. Missing site key and later chat challenge omission are intentional frontend branches, not proven bypasses. |
| Viewer operational resilience | `api/viewers.ts:9-60`; footer count initialization | Effective cache policy, outbound deadline behavior and provider quota/cost conditions | Mock fetch/environment using dummy values and an already-installed runtime in the complete sandbox. Owner inspects existing quota/cache settings. A single provider call per invocation does not by itself establish harmful amplification. |

### Execution prerequisites

The skill requires no external network, an empty allowlisted environment, read-only target/toolchain, writes confined to assigned scratch storage, and explicit CPU, memory, process, file-size, disk and time limits for target-controlled execution. Retained runtime evidence also requires trusted, race-safe artifact promotion. This review did not establish that complete capability and ran no target code.

Future tests should use dummy principals and minimum effects, preserve legitimate behavior, and stop at the boundary result. No dependency installation, paid/provider call, live identity, production data or shared-service test is needed for the local plans above.

## When

Resolve the CLI platform blocker before claiming completion of the exact skill workflow. Prioritize dependency and deployment/backend enforcement checks before making a broader release assurance claim. Add focused frontend regressions before security-sensitive renderer or session changes.

Source references use the `frontend/V.T.Thanh-Home-Angular/` prefix unless stated otherwise. See [COVERAGE.md](COVERAGE.md) for the reviewed paths and dispositions.
