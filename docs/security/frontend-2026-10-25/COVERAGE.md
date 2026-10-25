# Frontend review coverage — 25 October 2026

## What

Standard-profile, frontend-only source inspection. Nine units have completed source checks, two have blocked stronger assurance, and three are explicitly out of scope. No candidate or deferred unit remains. The formal skill workflow is incomplete because its prescribed CLI file-input protections are unavailable on Windows.

## Why

Coverage records distinguish inspected source from runtime, advisory and deployment facts. A covered source check means its stated source invariant was traced; it does not prove every possible attack impossible. A blocked unit retains its completed source evidence and the exact remaining assurance gap. No prior compatible ledgers/findings were found; no prior confirmations were carried.

## How

| Unit | Disposition | Reviewer | Source paths | Boundary / class |
|---|---|---|---:|---|
| archives | out_of_scope | unassigned | 0 | Access control |
| backend | out_of_scope | unassigned | 0 | Access control |
| edge-cost | covered | hunt-deployment | 4 | Feature abuse and data leakage |
| dependency-build | blocked | hunt-deployment | 31 | Obvious things |
| visual-lifecycle | covered | hunt-deployment | 27 | Wildcard |
| admin-inputs | covered | hunt-authority | 5 | Business logic |
| admin-session | covered | hunt-authority | 14 | Access control |
| blog-markdown | covered | hunt-render | 6 | Injection |
| chat-render | covered | hunt-render | 4 | Injection |
| contact-chat | covered | hunt-authority | 10 | Business logic |
| public-urls | covered | hunt-render | 18 | Resource and file handling |
| preferences | covered | hunt-render | 8 | Injection |
| proxy-cache | blocked | hunt-deployment | 5 | Access control |
| root-ci | out_of_scope | unassigned | 0 | Access control |

### Source evidence by unit

#### edge-cost — covered

**Invariant:** A public viewer-count request must not select another operator resource or destination, disclose the provider credential, or establish disproportionate shared work merely from missing throttling.

**Source result (hunt-deployment):** api/viewers.ts:9 does not consume incoming request fields. Lines 10–12 obtain operator environment values; lines 22–31 use a fixed HTTPS provider host and server-only Authorization header; lines 47–60 return only a numeric count or null. Footer initialization invokes the relative endpoint once at footer.component.ts:58–68 and displays the number through interpolation at footer.component.html:71. A function invocation performs at most one provider fetch in the authored path. No attacker-selected target, credential disclosure, or source-demonstrated amplification survives the candidate gate. Provider quotas, deployment caches and runtime behavior were not observed; no execution occurred.

#### dependency-build — blocked

**Invariant:** Build and published-asset source should not expose credentials or introduce caller-selectable code/dependency origins, and dependency assurance must distinguish lockfile provenance from current vulnerability status.

**Source result (hunt-deployment):** angular.json:20–29 selects src/main.ts, fixed bootstrap/CSS and public assets; production is the default at line 62, while source maps are explicitly enabled only in development at lines 56–59. tsconfig.app.json:8 excludes the separate api/viewers.ts edge entry from browser compilation by including src/**/*.ts only. src/main.ts:2–8 deliberately initializes the two Vercel SDKs. The lockfile statically parses as lockfileVersion 3 with 602 package entries; all entries declaring resolved URLs use https://registry.npmjs.org/, no link packages were found, and declared installation scripts are ordinary native/tooling packages. Bundled WASI entries lack separate resolved/integrity properties, so absence of those fields alone is not a proved substitution path. Public text assets and all nine translation dictionaries were inspected as static data; no private credential or active script-bearing dictionary value was identified. Public font/favicon binaries were inventoried only, not decoded or executed. No source-grounded vulnerability candidate was established. Current advisory applicability and actual build output cannot be established by these source checks.

**Invariant:** Local editor and documented commands must not create an unmapped automatic privileged execution or published-data surface.

**Source result (parent):** Frontend README maps existing SPA/Edge/proxy behavior; server security statements remain documentation only. Ignored local VS Code files recommend angular.ng-template and define explicit npm start/test launch tasks with loopback browser URLs. No automatic run-on-open task, arbitrary external destination, credential, or extra production source was found. Tasks were read, not executed.

**Remaining blockers:**

- No current advisory database was consulted under the no-network source-only assignment; the review does not establish whether the locked dependency versions have applicable known vulnerabilities.
- Application builds, installed package integrity and emitted production assets were not validated because target execution was prohibited without the complete required sandbox. Font/favicon binary parser safety was outside the source inspection.

#### visual-lifecycle — covered

**Invariant:** Visual effects and navigation lifecycle must not turn lower-trust data into executable programs, unbounded shared work, or persistent cross-principal authority.

**Source result (hunt-deployment):** Shaders are compile-time source literals; runtime inputs are viewport/mouse/theme values rather than fetched shader programs. ProjectShaderService caps node count at 75 desktop or 20 mobile at lines 33–35, cancels animation/listeners at lines 54–58, and pauses mobile animation on visibility changes at lines 61–68. HomeShaderService:101–119 and AboutShaderService:122–147 clean up animation/listeners/observers and graphics resources. BlogShaderService:104–113 cancels animation/listeners/observer but does not explicitly delete its GL program/buffer/shaders; no shared-service or cross-principal impact is established. RouteTransitionService:33–53 binds subscription lifetime to DestroyRef and clears its timer; wipe duration is fixed at lines 67–74. Footer timer is cleared at footer.component.ts:48–55. LoadingComponent:60–64 cancels animation frames; its short timeout and LoadingService timers are UI-local. Templates use interpolation, fixed handlers, source-owned image constants and router paths. No new executable untrusted source, shared-cost amplification or authority boundary failure was found in these assigned paths. Runtime resource measurements were not performed.

#### admin-inputs — covered

**Invariant:** Admin editor inputs and lower-trust contact records must not become executable browser markup or silently select a different privileged operation; writes should retain the selected record/version and require explicit confirmation for destructive actions.

**Source result (hunt-authority):** Source review found admin contact/message/delivery-error values rendered through interpolation, including admin_dashboard.component.html:351 and :364; no admin innerHTML, executable URL, DOM-evaluation, or navigation sink was found. Editor URL validation requires HTTPS without userinfo at admin_dashboard.component.ts:25-32; slugs and numeric display order are constrained at :78-112. Existing-record editor requests fetch and retain the version at :208-226 and :247-264, unsubscribe prior detail requests at :269-278 and :280-291, and send the version on save at :335-345 and :361-363. Published-blog/chapter constraints and a 200-KiB UTF-8 content bound are enforced at :324-343. Delete/block confirmations capture the resource/action at :383-407 and execute only on explicit confirm at :419-438. Credentialed server writes use fixed API paths at admin.service.ts:206-227 and :255-263. No source-grounded cross-principal failure survived. These checks cover frontend implementation only; server authorization, schema enforcement, and optimistic-lock behavior are not established.

#### admin-session — covered

**Invariant:** Frontend session state must fail closed on failed checks and expiry, avoid persisting credentials or admin session tokens in browser storage, clear privileged collections after confirmed logout, and preserve the configured same-origin XSRF mechanism.

**Source result (hunt-authority):** AdminService starts unauthenticated, removes a legacy stored session value, checks server session state, and guards stale check responses with a revision at admin.service.ts:49-90. Login uses credentialed POST after CSRF bootstrap, accepts authenticated === true, and clears credentials in finalize at :94-114. The login component resets/disables the form while submitting and clears credentials on finalize/pagehide/destruction at admin_login.component.ts:29-71. Successful logout clears the session and visitor registration at admin.service.ts:117-124; clearSession cancels in-flight admin streams and empties privileged collections at :287-298. Reads/writes handle 401 and section loads handle 403 at :245-285. Dashboard creation is gated by checked session state in admin.component.html:4-10; an unguarded lazy admin route at app.routes.ts:29-33 is not evidence of server authorization bypass. app.config.ts:15 retains default Angular XSRF behavior: installed @angular/common/fesm2022/_module-chunk.mjs:1068-1077 defines enabled-by-default XSRF-TOKEN/X-XSRF-TOKEN, and :1152-1177 adds the cookie token to same-origin mutations. Thus the unused JSON token response is not evidence of missing CSRF protection. No viable frontend-only authority or credential-disclosure candidate survived. Backend access checks, cookie flags, token/session rotation and actual server CSRF enforcement remain outside this source-only unit's assurance.

#### blog-markdown — covered

**Invariant:** Backend-provided blog strings must not acquire executable DOM authority or clobber security-sensitive browser state.

**Source result (hunt-render):** blog-api.service.ts:54-57 encodes the selected slug and reads a relative API path. blog.component.ts:140-146 copies chapter content to markdownContent; blog.component.html:57 sends it through MarkdownPipe into an ordinary innerHTML string binding. markdown.pipe.ts:17-22 returns empty when its browser/sanitizer prerequisites are absent, parses Markdown, and then invokes DOMPurify. Its explicit tag/attribute lists at lines 23-67 exclude scripts, event attributes, style, iframe, form, id, and name. No bypassSecurityTrust, alternate raw HTML assignment, attacker-controlled parser configuration, or subsequent clobbered-property consumer was found. Titles and summaries use interpolation, and the loading component consumes fixed stage strings and numeric progress. No concrete sanitizer bypass or cross-principal effect survived source review. No runtime/browser behavior was exercised.

#### chat-render — covered

**Invariant:** Visitor text and untrusted model/API replies must remain data when displayed in the chat UI.

**Source result (hunt-render):** chat-component.service.ts:32-35 trims and bounds outgoing text; lines 70-82 copy res.reply to an in-memory bot message. chat-components.html:138-144 displays visitor text using interpolation, while lines 107 and 162 render the static greeting and bot text through the shared MarkdownPipe. markdown.pipe.ts:21-68 applies DOMPurify after parsing with an explicit non-executable markup/attribute policy; the template receives a plain string without a discovered trust-bypass API. The chat component changes only fixed DOM styles and scroll positions; it does not execute model output, navigate according to model-produced commands, or dispatch model-selected tools. Markdown links/images remain intended presentation capabilities; no source-grounded path exposing another principal's private data through them was established in this frontend-only scope. No concrete rendering vulnerability survived source review; runtime sanitizer/browser behavior was not tested.

#### contact-chat — covered

**Invariant:** Visitor workflows should preserve fixed destinations, bounded ordinary UI submissions, explicit challenge actions and request identifiers; client state and validators must not be mistaken for proof of server authorization or operator-quota enforcement.

**Source result (hunt-authority):** Visitor registration bootstraps CSRF and sends only language/time-zone metadata to a fixed relative endpoint at visitor.service.ts:20-43. Contact form enforces local field constraints and blocks concurrent submissions at contact.component.ts:46-79; contact-api.service.ts:32-51 obtains visitor registration and a fresh contact challenge, sends a random idempotency key retained for the same failed payload, and invalidates registration on 401. Chat service trims and caps each message at 1,000 characters, serializes ordinary sends, generates crypto.randomUUID request IDs, and resets conversation readiness after 401 at chat-component.service.ts:32-65 and :85-98. Turnstile uses fixed Cloudflare script origin, a contact/chat action union, timeouts and widget cleanup at turnstile.service.ts:16-85. Missing site-key configuration deliberately yields an undefined token; chat deliberately omits a new token after first successful conversation response. These client behaviors cannot establish a CAPTCHA bypass because server token/session/challenge requirements are not in scope. Likewise, client request IDs and UI limits are not evidence that server quotas can be escaped. Browser chat history grows only in the requester's own in-memory state; no shared availability impact was established. No source-grounded candidate with a demonstrated or sufficiently traced cross-principal/operator result survived this frontend-only review.

#### public-urls — covered

**Invariant:** Public navigation/resource selectors must not permit lower-trust values to choose executable destinations, gain opener authority, or redirect privileged requests.

**Source result (hunt-render):** project.component.ts:28-112 supplies compile-time HTTPS project/image URLs and copies them into the active project list; it does not inject ProjectApiService. All project target=_blank links explicitly carry rel=noopener noreferrer at project.component.html:84-103,178-197,273-292. cloudinaryUrl.ts contains fixed image URLs; header component navigation paths and flag URLs are derived from fixed route/language maps. Footer fetches the fixed relative /api/viewers path and accepts only a numeric count; its external badge link is fixed and explicitly isolated. Other inspected shared component templates use interpolation, fixed router links, fixed images, or numeric/boolean styling rather than executable URL sinks. Blog banners are API-provided ordinary image src bindings, while detail requests encode slugs at blog-api.service.ts:56. No active attacker-to-navigation or opener-state failure was found. Dormant project-api.service.ts:31-32 concatenates a slug without component encoding, but no active caller or lower-trust source was found, so that is not a vulnerability candidate.

#### preferences — covered

**Invariant:** URL, locale, storage, and dictionary values must remain within supported presentation/navigation state and must not mutate prototypes, authorization state, or executable sinks.

**Source result (hunt-render):** preferences.ts:18-24 validates exact theme/language values, lines 34-59 validate reads/writes, and lines 83-106 anchor metadata URLs to a fixed HTTPS origin using DOM properties. site-bootstrap.js independently allowlists stored values and language prefixes, creates a fixed-directory translation preload, and builds fixed-origin canonical/alternate URLs. translation.service.ts:104-111 reconstructs internal language routes from path segments; lines 129-130 fetch only a SupportedLang dictionary path. Its recursive flatten at lines 151-165 writes string leaves into Map and skips __proto__, constructor, and prototype, with no recursive prototype/property merge gadget. ThemeService storage handling at lines 53-61 checks storage area/key and allows only presentation state; the resulting DOM classes, colorScheme, and favicon choice are constrained. Header language/nav/flag maps are fixed. No cross-account authority is stored or broadcast by these paths and no executable URL or HTML sink was found. No concrete preference or dictionary boundary violation survived source review.

#### proxy-cache — blocked

**Invariant:** Frontend routing and cache configuration must not establish a path that publicly caches private responses or bypasses the intended authority on management operations.

**Source result (hunt-deployment):** vercel.json:181–187 forwards fixed /api/v1 and /actuator namespaces to one fixed HTTPS backend; no incoming host or arbitrary destination controls the rewrite. Lines 150–165 declare private, no-store for those namespaces, and the static-asset cache rules at lines 47–64 do not independently prove a cache-deception path. Root Markdown negotiation is explicit at lines 169–179 and source also declares Vary: Accept at lines 76–78. Global intended controls include CSP, frame isolation, nosniff and HTTPS upgrading at lines 13–43. proxy.conf.json:2–10 uses fixed localhost development destinations. backend-health.service.ts:49–65 bounds active polling with exhaustMap, timeout and DestroyRef, and consumes only public UP/DOWN status. The frontend deliberately exposes an Actuator proxy namespace, but neither backend permissions nor actual cache/header attachment is visible within this scope. No concrete unauthorized response or private-data cache leak was established.

**Remaining blockers:**

- Actual provider header precedence, rewrite normalization and cache-key behavior were not observed; source configuration alone cannot prove effective production caching or policy attachment.
- Backend authorization and Actuator exposure configuration are excluded by the frontend-only scope. Consequently the broad proxy cannot be cleared for management-plane reachability, nor reported as a demonstrated authorization bypass.

### Reviewed source/configuration inventory

The 92 inventoried text files and three extensionless configuration files are represented in the source-check union below. One installed Angular HTTP implementation file was read to resolve actual XSRF request behavior; this is not a dependency implementation audit. Binary portfolio screenshots, favicon and font bytes were inventoried only.

- [frontend/README.md](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/README.md)
- [frontend/V.T.Thanh-Home-Angular/.editorconfig](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/.editorconfig)
- [frontend/V.T.Thanh-Home-Angular/.gitignore](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/.gitignore)
- [frontend/V.T.Thanh-Home-Angular/.postcssrc.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/.postcssrc.json)
- [frontend/V.T.Thanh-Home-Angular/.prettierrc](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/.prettierrc)
- [frontend/V.T.Thanh-Home-Angular/.vscode/extensions.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/.vscode/extensions.json)
- [frontend/V.T.Thanh-Home-Angular/.vscode/launch.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/.vscode/launch.json)
- [frontend/V.T.Thanh-Home-Angular/.vscode/tasks.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/.vscode/tasks.json)
- [frontend/V.T.Thanh-Home-Angular/README.md](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/README.md)
- [frontend/V.T.Thanh-Home-Angular/angular.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/angular.json)
- [frontend/V.T.Thanh-Home-Angular/api/viewers.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/api/viewers.ts)
- [frontend/V.T.Thanh-Home-Angular/eslint.config.js](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/eslint.config.js)
- [frontend/V.T.Thanh-Home-Angular/node_modules/@angular/common/fesm2022/_module-chunk.mjs](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/node_modules/@angular/common/fesm2022/_module-chunk.mjs)
- [frontend/V.T.Thanh-Home-Angular/package-lock.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/package-lock.json)
- [frontend/V.T.Thanh-Home-Angular/package.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/package.json)
- [frontend/V.T.Thanh-Home-Angular/proxy.conf.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/proxy.conf.json)
- [frontend/V.T.Thanh-Home-Angular/public/fonts/Inter-LICENSE.txt](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/fonts/Inter-LICENSE.txt)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/de.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/de.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/en.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/en.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/es.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/es.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/fr.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/fr.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/ja.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/ja.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/kr.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/kr.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/ru.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/ru.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/vi.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/vi.json)
- [frontend/V.T.Thanh-Home-Angular/public/i18n/zh.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/i18n/zh.json)
- [frontend/V.T.Thanh-Home-Angular/public/llms.txt](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/llms.txt)
- [frontend/V.T.Thanh-Home-Angular/public/robots.txt](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/robots.txt)
- [frontend/V.T.Thanh-Home-Angular/public/sitemap.xml](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/public/sitemap.xml)
- [frontend/V.T.Thanh-Home-Angular/src/app/app.config.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/app/app.config.ts)
- [frontend/V.T.Thanh-Home-Angular/src/app/app.css](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/app/app.css)
- [frontend/V.T.Thanh-Home-Angular/src/app/app.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/app/app.html)
- [frontend/V.T.Thanh-Home-Angular/src/app/app.routes.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/app/app.routes.ts)
- [frontend/V.T.Thanh-Home-Angular/src/app/app.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/app/app.ts)
- [frontend/V.T.Thanh-Home-Angular/src/assets/cloudinaryUrl.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/assets/cloudinaryUrl.ts)
- [frontend/V.T.Thanh-Home-Angular/src/configs/apis.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/configs/apis.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/about/components/about.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/about/components/about.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/about/services/about-shader.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/about/services/about-shader.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/about/templates/about.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/about/templates/about.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/components/admin.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/components/admin.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/components/admin_dashboard.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/components/admin_dashboard.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/components/admin_login.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/components/admin_login.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/services/admin.models.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/services/admin.models.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/services/admin.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/services/admin.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/templates/admin.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/templates/admin.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/templates/admin_dashboard.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/templates/admin_dashboard.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/admin/templates/admin_login.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/admin/templates/admin_login.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/blog/components/blog.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/components/blog.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/blog/components/blog.load.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/components/blog.load.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/blog/services/blog-api.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/services/blog-api.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/blog/services/blog-shader.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/services/blog-shader.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/blog/templates/blog.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/templates/blog.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/blog/templates/blog.load.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/blog/templates/blog.load.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/chat/components/chat.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/chat/components/chat.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/chat/services/chat-component.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/chat/services/chat-component.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/chat/templates/chat-components.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/chat/templates/chat-components.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/contact/components/contact.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/contact/components/contact.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/contact/services/contact-api.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/contact/services/contact-api.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/contact/templates/contact.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/contact/templates/contact.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/home/components/home.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/home/components/home.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/home/services/home-shader.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/home/services/home-shader.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/home/templates/home.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/home/templates/home.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/features/project/components/project.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/project/components/project.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/project/services/project-api.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/project/services/project-api.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/project/services/project-shader.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/project/services/project-shader.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/features/project/templates/project.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/features/project/templates/project.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/index.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/index.html)
- [frontend/V.T.Thanh-Home-Angular/src/main.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/main.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/color-wipe/color-wipe.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/color-wipe/color-wipe.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/color-wipe/color-wipe.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/color-wipe/color-wipe.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/comming-soon/comming-soon.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/comming-soon/comming-soon.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/comming-soon/comming-soon.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/comming-soon/comming-soon.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/footer/footer.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/footer/footer.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/footer/footer.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/footer/footer.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/header/header.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/header/header.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/header/header.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/header/header.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/loading/loading.component.html](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/loading/loading.component.html)
- [frontend/V.T.Thanh-Home-Angular/src/shared/components/loading/loading.component.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/components/loading/loading.component.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/interceptors/loading.interceptor.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/interceptors/loading.interceptor.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/pipes/markdown.pipe.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/pipes/markdown.pipe.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/services/backend-health.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/backend-health.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/services/loading.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/loading.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/services/route-transition.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/route-transition.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/services/theme.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/theme.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/services/translation.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/translation.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/services/turnstile.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/turnstile.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/services/visitor.service.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/services/visitor.service.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/utils/mobile-shader.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/utils/mobile-shader.ts)
- [frontend/V.T.Thanh-Home-Angular/src/shared/utils/preferences.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/shared/utils/preferences.ts)
- [frontend/V.T.Thanh-Home-Angular/src/site-bootstrap.js](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/site-bootstrap.js)
- [frontend/V.T.Thanh-Home-Angular/src/styles.css](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/styles.css)
- [frontend/V.T.Thanh-Home-Angular/src/utils/validators.ts](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/src/utils/validators.ts)
- [frontend/V.T.Thanh-Home-Angular/tsconfig.app.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/tsconfig.app.json)
- [frontend/V.T.Thanh-Home-Angular/tsconfig.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/tsconfig.json)
- [frontend/V.T.Thanh-Home-Angular/tsconfig.spec.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/tsconfig.spec.json)
- [frontend/V.T.Thanh-Home-Angular/vercel.json](C:/Users/hp/Desktop/MyProjects/V.T.Thanh-Home/frontend/V.T.Thanh-Home-Angular/vercel.json)

### Independent coverage checks

The post-wave critic and distinct final-clean critic each returned no missing units and no reassignments. Their accepted stop assessment applies to this enumerated source scope. Backend, archives and root CI remain excluded; dependency advisories/build output and actual deployment/management authority remain blocked. Candidate/final record verification had zero records to process.

The unchanged CLI validators were attempted and failed on Windows OS input-safety capability. Exported validateDocument functions passed for the parent-generated 14-unit ledger and empty findings data. Those structural checks do not replace CLI safety. No target-controlled application, test, build, fixture, browser or live application/provider probe was executed.

## When

At report generation, SHA-256 checks matched all 106 inventoried frontend files to the captured baseline. Re-run source coverage after relevant changes, and resolve blocked assurance areas before claiming broader release assurance. Formal metadata, ledger and empty findings are retained at C:/Users/hp/security-audit-skill/V.T.Thanh-Home/run-1 outside the repository.
