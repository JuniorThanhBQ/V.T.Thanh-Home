# Frontend: Angular portfolio

## WHAT

The frontend is an Angular **22.2.3** standalone application, version **3.1.1** in [package.json](V.T.Thanh-Home-Angular/package.json). The manifest declares TypeScript `~6.0.2`, RxJS `~7.8.0`, Tailwind CSS 4, Three.js, Marked, and DOMPurify. Use Node.js 24.x with its bundled npm in CI. Vercel selects npm automatically from the committed lockfile and platform configuration; no custom Install Command override should be set in the Vercel dashboard. Use the lockfile with `npm ci` for reproducible dependency installation.

Angular uses same-origin `/api/v1/...` URLs for visitor registration, chat, blogs, contacts, and admin operations. Projects render six static entries with their existing i18n labels; the public project component does not call the project API. Administrator project records are managed independently.

| Feature | Current behavior |
|---|---|
| Pages | Lazy-loaded home, about, projects, blog, contact, and admin components; chat is available through the site interface |
| Languages | Vietnamese, English, Chinese, Japanese, French, German, Spanish, Russian, and Korean; JSON dictionaries in `public/i18n` |
| Appearance | Light/dark themes with saved preferences and system-theme fallback |
| Backend status | Shared health service exposes `UNKNOWN`, `UP`, and `DOWN` with a last-checked timestamp |
| Administration | Session-based access to content editors, contact inbox, visitors, and operational metrics |

The application routes are defined in [app.routes.ts](V.T.Thanh-Home-Angular/src/app/app.routes.ts); endpoint paths are centralized in [apis.ts](V.T.Thanh-Home-Angular/src/configs/apis.ts).

## WHY

Browser JavaScript cannot read backend deployment environment variables. A shared-origin proxy provides consistent routing and cookie/XSRF behavior in development and production.

Stored theme and language preferences preserve presentation choices across reloads. Authentication remains in the backend session rather than a browser-storage login flag. Static pages remain usable when backend startup or visitor registration is delayed; API features expose their own loading and failure states.

## HOW

### Local development and commands

Start the backend with the repository-root Compose configuration as described in the [backend guide](../backend/README.md). Set local `SERVER_PORT=8080` and `APP_CORS_ALLOWED_ORIGINS=http://localhost:4200`.

Run the following commands from `frontend/V.T.Thanh-Home-Angular`:

| Command | Purpose |
|---|---|
| `npm ci` | Install locked dependencies |
| `npm start` | Start the Angular development server at `http://localhost:4200` |
| `npm run lint` | Run Angular ESLint |
| `npm run build` | Build the production application |
| `npm run watch` | Rebuild using the development configuration |
| `npm run prettier` | Format TypeScript, HTML, and CSS under `src` |
| `npm test` | Invoke the configured Angular unit-test runner; tests are located in `tests/` |

The dev server uses [proxy.conf.json](V.T.Thanh-Home-Angular/proxy.conf.json) to forward `/api/v1/**` and `/actuator/**` to `http://localhost:8080`. Restart `ng serve` after changing proxy configuration. Align the proxy target with the actual backend port.

### Vercel deployment and API routing

- Use `frontend/V.T.Thanh-Home-Angular` as the Vercel project root, build with `npm run build`, and publish `dist/V.T.Thanh-Home-Angular/browser`. The supplied [vercel.json](V.T.Thanh-Home-Angular/vercel.json) rewrites API requests to `https://vtthanh-backend-latest.onrender.com/api/v1/...`, preserving the prefix.
- If the Render hostname changes, update the Vercel rewrite destinations together. SPA paths still resolve to `index.html`; API paths do not.
- Groq, database, Gmail, and Turnstile secrets belong on Render, never in Angular bundles or Vercel frontend variables. The public Turnstile site key is obtained from backend public configuration.
- API and Actuator responses use `private, no-store`. Hashed JS/CSS assets have immutable caching, while HTML and other JS/CSS revalidate. Vercel defines CSP and other security headers; update their allowlists when introducing external resources.
- Requests to `/` with exactly `Accept: text/markdown` are rewritten to `/llms.txt`. `robots.txt`, `llms.txt`, and `sitemap.xml` are excluded from SPA fallback routing.

Vercel Analytics and Speed Insights initialize in `src/main.ts`. The footer separately requests `/api/viewers`, implemented by the Vercel Edge handler [api/viewers.ts](V.T.Thanh-Home-Angular/api/viewers.ts). Configure `VERCEL_TOKEN` and `VERCEL_PROJECT_ID`, plus optional `VERCEL_TEAM_ID`, in the Vercel function environment for that handler. These credentials stay server-side. Missing credentials or an unsuccessful analytics lookup return `viewers: null`; the handler does not invent a count. The Angular development proxy does not forward `/api/viewers`, so the counter requires a functioning Vercel handler rather than Spring Boot.

### Languages, theme, and metadata

Vietnamese uses unprefixed routes such as `/about`. Other languages use `/en`, `/de`, `/fr`, `/ja`, `/zh`, `/es`, `/ru`, or `/kr`, followed by the page path. The Korean dictionary and route use `kr`; browser-language detection, the HTML `lang` attribute, and `hreflang` metadata use `ko` where appropriate.

On the root URL, language selection uses the saved `app_language` value, then a supported browser language, then Vietnamese. On other paths, the URL determines the language. The early [site-bootstrap.js](V.T.Thanh-Home-Angular/src/site-bootstrap.js) applies theme and language before Angular starts, preloads the selected dictionary, and sets canonical/alternate links. Language switching preserves the page path; dictionary requests have a 15-second timeout.

Theme preference is stored as `app_theme`. Without a saved value, the application follows the operating system's color scheme. Theme changes synchronize between tabs through storage events. Storage access failures are handled without preventing the application from loading. The theme also changes the favicon.

Canonical and alternate URLs currently use `https://www.juniorthanh.id.vn` in both the bootstrap script and [preferences.ts](V.T.Thanh-Home-Angular/src/shared/utils/preferences.ts). Review both when changing the public domain.

### Backend readiness and visitor sessions

The [backend health service](V.T.Thanh-Home-Angular/src/shared/services/backend-health.service.ts) starts with `UNKNOWN` and no last-check time. It requests `/actuator/health` immediately, then schedules polling every 45 seconds. Each request has a 120-second timeout; polling ticks are ignored while the previous poll is still running. Manual `checkHealth()` calls can run separately.

Only a response whose status is `UP` produces the healthy state. Other responses, request failures, and timeouts produce `DOWN`. The footer, chat, and contact views use localized status text; standby text estimates two minutes for server startup. This text is an estimate rather than a countdown or a measured readiness promise.

Health polling does not extend all API deadlines. CSRF and blog reads use 60-second timeouts, visitor registration has a 65-second pipeline timeout, and chat/contact writes have 65-second request timeouts. A feature request can fail before a delayed health check finishes; retry after the backend becomes ready.

- Visitor startup fetches CSRF and submits browser language/time zone once. Failed registration does not block static browsing. Chat/contact retry registration after a session expiry.
- Blog requests have finite deadlines, explicit change-detection notification, and error/retry/empty states. Empty databases show an empty journal. Only published records are public.

### Administrator behavior

- Administrator authentication is checked with the backend session before rendering the dashboard. No login credentials or authentication flags are written to application browser storage. Both form fields clear immediately on submission, after all outcomes, on page hide and on component destruction. Temporary credential object properties clear when the request completes or is cancelled. The backend HttpOnly session cookie still identifies the signed-in session.
- The form requests `autocomplete="off"`. Browsers and password-manager extensions can ignore this request; the application cannot guarantee that they never offer to save or autofill credentials. JavaScript strings and browser network-inspection records cannot be securely erased by application code.
- Blogs support all chapters, chapter reordering, draft/publication status, slug and metadata editing. Projects support backend CRUD, technology stacks, ordering and publication status. These admin project records remain independent of the public page's six static translated entries. Editors load full records and send their version; failed saves remain open with edits intact.
- Contacts provide the real inbox, delivery status, message details and confirmed deletion. Visitors provide the existing minimal API records, 50 per page, with confirmed blocking/unblocking. No visitor credentials or fabricated user statistics are shown.
- Overview fetches health, database component status and JVM metrics on demand. Missing measurements display Unavailable. Local and Vercel routes forward `/actuator/**` to the backend; Spring Security still restricts metrics to administrators. API/Actuator responses have no-store caching on Vercel. Administrative chat history has no backend API and is omitted.
- Logout only clears the signed-in view after backend confirmation; failures remain visible. Expired authorization clears cached private records and cancels pending requests. There are no automatic write retries or continuous polling of administrator data; the shared public health poll remains separate.

## WHEN

### Before merging or deploying

Run `npm run lint` and `npm run build`. No frontend `.spec.ts` files currently exist. Test-runner configuration remains available, and CI runs frontend tests only when `.spec.ts` files exist. Invoking `npm test` without test files does not provide regression coverage.

Verify language switching, a direct visit to a prefixed URL, reload persistence, browser-language fallback, theme synchronization between tabs, and operation when browser storage is unavailable. Confirm static pages still render when the backend is unavailable, and that standby/error labels update after health checks complete.

### After deployment or shared configuration changes

Publish a compatible Spring Boot release first or together with the frontend. Verify API and Actuator requests from the deployed Vercel hostname, CSRF/session cookies, Turnstile, one real chat response, contact acceptance, and administrator login/logout. Confirm published blogs load and an empty database produces the empty state. Administrator project edits do not update the six static public project cards.

After changing the Render hostname, update API and Actuator rewrite destinations and review the CSP connection allowlist. After changing the public frontend domain, update canonical/alternate URL generation, backend CORS origins, and Turnstile hostnames. Change all nine dictionaries when adding or revising shared UI text.

The repository's hourly GitHub health workflow is separate from browser polling. Its backend probe currently allows only 45 seconds, so the repository badge and browser readiness state can temporarily differ during startup. The image vulnerability badge reports the published Docker Hub image and does not measure runtime health.
