# Frontend source security review — 25 October 2026

**Backend follow-up — 26 October 2026:** Backend authorization, CSRF/session, ownership, publication, idempotency and challenge controls have now been inspected at source level. Read [BACKEND-FOLLOW-UP.md](BACKEND-FOLLOW-UP.md) for the evidence and remaining limits. Statements below that backend implementation had not yet been reviewed describe the historical 25 October scope; runtime/deployment and CLI-validation gaps remain unresolved.

## What

**Source inspection result: zero confirmed vulnerabilities and zero surviving vulnerability candidates.** This is a frontend-scoped static review, not a finding that the deployed application is secure.

**Formal security-audit workflow status: INCOMPLETE.** The prescribed CLI validators cannot open their input safely on this Windows host: `OS no-follow and nonblocking input protection is unavailable`. Exported validation functions were used for additional structural checks of parent-generated data; that does not replace the prescribed CLI safety gates. Runtime, dependency-advisory and deployment assurance also remain limited as detailed below.

| Item | Reviewed scope or result |
|---|---|
| Date | 2026-10-25, Asia/Saigon |
| Repository revision | `43df4e21835809be9dd9698a91aff036f6403f12` |
| Initial working tree | Untracked `.agents/` and `skills-lock.json`; active frontend tracked files initially unchanged |
| Profile | Standard, explicitly scoped to frontend source |
| Application | `frontend/V.T.Thanh-Home-Angular`, plus `frontend/README.md` |
| Included runtimes | Angular browser application and frontend-project Vercel Edge handler `api/viewers.ts` |
| Source inventory | 92 text files and 3 extensionless configuration files inspected; 11 binary image/font/favicon assets inventoried, not decoded |
| Confirmed / needs-validation / rejected records | 0 / 0 / 0 |
| Unvalidated vulnerability candidates | 0 |
| Source coverage units | 9 covered, 2 blocked, 0 candidates, 0 deferred |
| Explicit out-of-scope units | Backend, archived applications, repository-root CI/release workflows |
| Reviewers | Four reconnaissance roles, three focused source reviewers, two distinct coverage critics; no user-set invocation budget |
| Prior evidence | No compatible prior ledger/findings found in the requested report location or default external audit root |

This audit created only Markdown report files inside the repository. It did not edit frontend/backend source, configuration, lockfiles, dependencies, Git ignore rules, or installed skills. Machine-readable audit bookkeeping is retained outside the repository at `C:/Users/hp/security-audit-skill/V.T.Thanh-Home/run-1`.

During the review, an unrelated working-tree change removed the `AGENTS.md` ignore entry from `.gitignore`, making `AGENTS.md` appear untracked. The audit did not make or revert that change. The frontend inventory remained unchanged.

Related documents: [coverage and method](COVERAGE.md), [finding details](FINDINGS-DETAIL.md), [validation limits and next steps](NEEDS-VALIDATION.md), and [architecture](architecture.md).

## Why

The review followed browser/API input through rendering, navigation, storage, requests, session state and deployment configuration. A security finding required a concrete lower-trust principal, affected resource, crossed boundary and supported result. Missing tests, an exposed route name, or an absent optional safeguard did not satisfy that requirement.

The source has several useful controls:

- **Markdown output is sanitized.** [MarkdownPipe:17](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/pipes/markdown.pipe.ts:17) parses then applies DOMPurify with explicit tag/attribute allowlists. Blog content reaches it at [blog rendering:57](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/templates/blog.component.html:57); bot output reaches it at [chat rendering:162](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/chat/templates/chat-components.html:162). No authored trust-bypass API or alternate raw HTML assignment was found. This source trace is not a browser-executed sanitizer regression.
- **Admin state depends on a backend session response.** [session checks:70](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/services/admin.service.ts:70) handle stale responses; [dashboard creation:4](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/templates/admin.component.html:4) waits for checked authentication. Credentials are cleared from the form/request object, and successful logout cancels admin streams and clears private collections. No admin token is persisted by the inspected application.
- **Same-origin XSRF support is present.** [HTTP configuration:15](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/app/app.config.ts:15) retains the framework defaults. Read-only inspection of the installed Angular HTTP source confirms the default cookie/header mechanism for same-origin mutations. Merely not copying the CSRF endpoint's JSON token into a manual header is therefore not a demonstrated missing-CSRF defect. Server cookie/header matching and enforcement remain unreviewed.
- **Preference and navigation inputs are constrained.** [preference guards:18](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/utils/preferences.ts:18) accept fixed language/theme values, and metadata uses a fixed HTTPS origin. [dictionary flattening:151](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/translation.service.ts:151) uses a Map and skips prototype-sensitive keys.
- **Viewer credentials remain server-side in the authored path.** [viewer handler:9](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/api/viewers.ts:9) uses a fixed provider host, does not consume request parameters, and returns only a number or null. No source-grounded provider-token disclosure or attacker-selected outbound destination was established.
- **Deployment source declares protective policies.** [Vercel header policy:13](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/vercel.json:13) specifies framing restrictions, CSP, nosniff and related headers, while API/Actuator paths declare private no-store caching. Effective provider behavior was not observed.

These controls explain why the inspected patterns did not become vulnerability records. They do not establish backend authorization, cookie security, production header delivery, sanitizer behavior for every browser, or absence of vulnerable dependencies.

## How

### Confirmed findings

| Severity | Title | Affected boundary | Demonstrated result |
|---|---|---|---|
| — | No confirmed records | — | No runtime exploit or cross-principal boundary violation was demonstrated |

No severity ratings or reproduction claims are assigned to the hardening notes below. There are no surviving source-grounded `needs_validation` vulnerability records either. General assurance gaps are tracked as coverage limitations, rather than invented vulnerability leads.

### Hardening and maintenance recommendations

| Priority / timing | What and why | Smallest follow-up |
|---|---|---|
| Before the next security-sensitive frontend release | No authored frontend test suite was found. Important sanitizer and session controls currently lack visible regression fixtures. | Add dummy-data tests for the actual Angular Markdown sinks, rejected executable attributes/URLs, valid Markdown, stale session responses, 401/403 clearing, pending-request cancellation, and successful/failed logout. Preserve intended links, images, tables and editor behavior. |
| When maintaining the viewer handler | The handler declares public shared caching, while the general API rule declares private no-store. The effective policy is unknown; the returned count is intended public data. | Reconcile the exact `/api/viewers` policy without weakening private API caching. Inspect provider configuration/existing cache observations. Consider a finite outbound deadline and mock success/failure/timeout cases. No quota abuse or confidential-data leak was demonstrated. |
| Before enabling the dormant project API on the public page | `getProjectBySlug` concatenates an unencoded path value. The active public project page uses static records, so no attacker-to-request path was established. | Encode the slug as a single path component, as the blog service already does, and add a path-construction regression when this service becomes active. |
| Routine release maintenance | Application, lockfile and frontend guide version metadata disagree. This reduces traceability, without demonstrating package substitution. | Align version metadata during the normal release process and retain locked dependency provenance. |

Evidence for viewer cache behavior: [handler cache directive:53](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/api/viewers.ts:53) and [general API cache rule:160](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/vercel.json:160). Evidence for dormant slug handling: [project detail request:31](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/project/services/project-api.service.ts:31), compared with [blog detail request:54](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/services/blog-api.service.ts:54). Test selection: [test source selection:8](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/tsconfig.spec.json:8).

### Coverage and verification

The independent post-wave and distinct final coverage critics accepted no missing source units and no reassignments. The source-path union covers the enumerated text/configuration inventory. Two units remain **blocked for stronger assurance**:

1. **Dependencies/build:** lockfile provenance was inspected, but no current advisory database, package-integrity verification, build or emitted-asset inspection was performed.
2. **Proxy/cache/deployment authority:** intended configuration was inspected, but provider header/cache precedence and excluded backend/Actuator authorization were not verified.

Backend/model prompts, server-side authorization and input enforcement, session-cookie attributes/revocation, Turnstile verification, idempotency and quota enforcement, production identity/provider configuration, archived code, root CI, and binary-media parser safety are outside the established evidence.

No application code, browser, tests, builds, scanners against the application, or provider/live endpoint probes were run. Existing installed framework source was read where it resolved a concrete request-behavior question. Audit tooling and host capability diagnostics are separate from application execution. No vulnerability candidate survived the source gates, so candidate-validation and final-record verification had no records to process.

The validator functions checked parent-generated ledger/empty findings structure; CLI invocation failed for the platform reason stated above. The validators were not modified, and successful structural checks are not represented as successful CLI gates. No clean-system or exhaustive-security claim is made; one source pass cannot exhaust an application's attack surface.

## When

The current deliverable is the completed enumerated **source inspection** and its reports. Completing the exact skill workflow requires a compatible CLI input-safety environment. Runtime validation would additionally require all sandbox and artifact-promotion controls specified by the skill; none were assumed available.

Before relying on a release security assurance decision, complete the two blocked coverage areas and the bounded validation work in [NEEDS-VALIDATION.md](NEEDS-VALIDATION.md). A later backend review should verify enforcement behind admin, contact/chat and Actuator requests; that work was deliberately excluded here.

Frontend source integrity was checked against the captured inventory at the end of the review. The review describes possible improvements and applies none of them.
