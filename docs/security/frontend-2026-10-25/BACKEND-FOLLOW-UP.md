# Backend source follow-up to frontend review — 26 October 2026

## What

The backend source review now answers several questions that were outside the frontend-only inspection on 25 October. This addendum changes their **source-review status**, not the historical frontend result or production assurance.

See [backend report](../backend-2026-10-26/REPORT.md) and [backend coverage](../backend-2026-10-26/COVERAGE.md). Frontend source itself was not changed or re-audited. Backend/Compose source was unchanged between the original and resumed repository references.

## Why

Frontend code shows what a browser requests. Backend code is needed to inspect authorization, server-selected identity, validation and resource ownership. Those implementations have now been traced. Tests were read, not executed; deployed behavior remains unobserved.

## How

All Java paths below use `backend/V.T.Thanh-Home-SpringBoot/src/main/java/com/vtthanh/V/T/Thanh_Home_SpringBoot/`.

| Previously outside frontend scope | Backend evidence now inspected | What remains unresolved |
|---|---|---|
| Administrator and Actuator authorization | `config/SecurityConfig.java:41-50`: public exceptions are explicit, admin/non-health Actuator require ADMIN, unmatched routes deny. | Actual deployed artifact, route/filter attachment and proxy behavior. |
| Angular/backend CSRF compatibility | `config/SecurityConfig.java:34-36` configures cookie token repository/request handler; `controller/VisitorController.java:26-28` materializes bootstrap token. This complements previously inspected Angular XSRF defaults. | Browser cookie/header exchange and effective deployment configuration. |
| Session fixation/logout | `service/AdminAuthService.java:53-89`: active account/password check, existing session-ID change, server ADMIN context, logout invalidation. | Runtime lifecycle, expiry and any future immediate account-disable/password-change revocation contract. |
| Session cookie policy | Base application YAML declares HttpOnly, SameSite Lax and a 30-minute timeout; production YAML fixes Secure true. | Active profile, TLS/proxy topology and actual delivered cookie. |
| Visitor/chat isolation | `service/VisitorService.java:56-67` resolves session-held visitor and checks blocking. `controller/ChatController.java:24-58` selects conversation from server session; `service/ChatService.java:170-178` checks visitor ownership. | Runtime concurrency and deployed session topology. |
| Contact idempotency/input checks | `service/ContactService.java:40-89` validates, limits/challenges, binds visitor ID and looks up idempotency within that visitor. SQL migration adds visitor/key uniqueness. | Applied migrations, concurrency and provider behavior. |
| Public draft/unpublished exclusion | `service/BlogService.java:31-43` filters PUBLISHED on list/detail; `service/ProjectService.java:22-34` filters published on list/detail. | Runtime ORM/database behavior and deployed cache policy. |
| Later chat requests omit a fresh challenge | `controller/ChatController.java:40-48` verifies while server session lacks CHAT_TOKEN; `service/TurnstileVerificationService.java:47-69` checks provider success/action/hostname when enabled. | Actual enablement/keys/hostnames/provider response. Production Compose explicitly defaults verification off, as already documented in `backend/README.md:71`; production YAML defaults it on. |
| Chat quotas/provider cost controls | `service/ChatService.java:58-114,158-167` and limiter/client code include message/request-ID limits, ownership, concurrency, request windows, process-local UTC budget and bounded provider attempts/context/output. | Deployment-wide accounting across replicas/restarts, correct proxy peer identity and runtime cancellation/provider behavior. |

These paths did not establish a new frontend vulnerability. Current frontend dependency advisories, actual Angular DOM sanitizer behavior, Vercel viewer-cache policy and deployed response headers remain unverified. Backend inspection does not resolve the standalone frontend Vercel viewer handler's cache/deadline observations.

No runtime vulnerability or exploit result is inferred from the presence of source controls. The formal security-audit workflow still has the Windows CLI input-safety blocker described in both reports.

## When

Use this addendum instead of the historical report's statement that backend implementation had not yet been inspected. Preserve its remaining frontend/runtime/deployment limitations.

Before production configuration changes, choose the Turnstile policy explicitly and inspect the effective launch/profile/cookie/proxy settings. Before a broader release assurance claim, complete the backend and frontend validation plans in a compatible, fully contained environment.
