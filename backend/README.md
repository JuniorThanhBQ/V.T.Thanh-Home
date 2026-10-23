# Spring Boot connection and deployment

## WHAT

The API serves visitor registration, protected chat, public blogs, contact submissions, and administrator operations. Angular uses relative URLs under `/api/v1`. Its development server and Vercel forward those requests to Spring Boot. The browser keeps a server session cookie; visitor credentials are not stored in browser storage.

## WHY

The same-origin proxy avoids cross-site cookie restrictions and allows Angular's built-in XSRF handling. Backend credentials must reach the backend process, not the frontend bundle. A root `.env` supplies Compose interpolation; it is not automatically a Spring Boot environment.

## HOW - Local development

1. Populate the repository-root `.env` using `.env.example`. Set the database values, local `SERVER_PORT=8080`, and at least one Groq key (`GROQ_API_KEY` or `GROQ_API_KEYS`). Keep that file private.
2. From the repository root run `docker compose up --build -d backend`.
3. In `frontend/V.T.Thanh-Home-Angular`, run `npm ci` when dependencies need installing, then `npm start`.
4. Open `http://localhost:4200`. The dev proxy forwards `/api/v1/**` and `/actuator/health` to `http://localhost:8080`.
5. If you change the backend port, change the dev proxy target too. Add an exact CORS origin when using a different browser origin/port.

Compose explicitly forwards Groq, knowledge-file, mail, administrator, and Turnstile settings. It overrides secure session cookies for local HTTP. Local email delivery defaults off (`CONTACT_EMAIL_DELIVERY_ENABLED=false`); enable it explicitly when ready to send queued notifications. Local Turnstile defaults off unless `TURNSTILE_ENABLED=true`; that is an explicit local setting, not a bypass on failed production verification.

For direct `bootRun`, export the same application variables into your shell first, set `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/<database>`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, and use a non-production profile for local HTTP. Spring does not read arbitrary `.env` files. No committed password fallback exists.

### Production on Render

Use the repository root as the Docker build context and `backend/Dockerfile` as the Dockerfile. Supply these in Render's environment settings:

The Docker build packages `app.jar` and uses `backend/Dockerfile.dockerignore` to include only backend build inputs. Production dependency artifacts are resolved before application sources are copied, so source-only changes can reuse that layer. Tests run separately in CI and are not included in the image build context.

The Temurin JDK and JRE defaults are pinned by digest in `backend/Dockerfile`. When updating Java, verify both image manifests, update both digests together, rebuild, scan the runtime image, and rerun database-backed startup checks. The build arguments are named `TEMURIN_JDK_VERSION` and `TEMURIN_JRE_VERSION`.

The container entrypoint selects `PORT`, then `SERVER_PORT`, then `8080`, and exports the selected value as `SERVER_PORT` before replacing the shell with Java. This keeps Spring's environment-property binding aligned with the Docker health check even when both port variables are supplied. `JAVA_TOOL_OPTIONS` defaults to a 65% maximum heap and tier-1 compilation; override it in the runtime environment when benchmarking startup against peak request performance.

| Setting | Value/purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | Reachable PostgreSQL JDBC URL, with the deployment's required TLS parameters |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Database credentials |
| `GROQ_API_KEY` or `GROQ_API_KEYS` | One key or a comma-separated/JSON-array key list; server-only |
| `CHAT_MODEL` | Default `openai/gpt-oss-20b`; choose a model actually available to the configured key |
| `CHAT_FILE_URL` | Public UTF-8 text/Markdown knowledge document; Google Drive `/file/d/.../view` URLs are converted to download URLs |
| `CHAT_DAILY_GENERATION_LIMIT` | Initial per-instance cap, default 200 attempts/day in UTC |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Optional first-account bootstrap; password at least 12 characters; changing these does not reset an existing account |
| `APP_CORS_ALLOWED_ORIGINS` | Exact browser origins, including `https://www.juniorthanh.id.vn`; add any custom domain explicitly |
| `TURNSTILE_ENABLED` | `true` for protected production contact/chat creation |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Corresponding widget keys; secret stays on Render |
| `TURNSTILE_HOSTNAMES` | Comma-separated exact frontend hostnames, without scheme/path; match Cloudflare widget configuration |
| `CONTACT_EMAIL_DELIVERY_ENABLED` | Set `true` only when real notification delivery is intended |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Gmail OAuth credentials when contact email delivery is enabled |
| `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME`, `EMAILS_RECIPIENT_EMAIL` | Verified sender identity and fixed recipient |

Render's injected `PORT` takes precedence over `SERVER_PORT`; the Docker health check uses the same port selection. The production profile uses Secure, HttpOnly, SameSite=Lax session cookies. Requests must come through the HTTPS frontend proxy. Do not use a direct cross-site API URL for Angular.

Flyway runs migrations before Hibernate's `validate`. V5 adds visitor metadata, chat ownership/request state, and scoped contact idempotency. Existing chat records have no visitor owner and are intentionally inaccessible to newly registered browser sessions. Do not edit applied migrations or delete database volumes to resolve validation failures.

### Groq and knowledge troubleshooting

The former default `llama-3.3-70b-versatile` was absent from the active-model list returned for the configured key during this review. The new default was confirmed in that list. See [Groq models](https://console.groq.com/docs/models) and [GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b).

A Drive preview is HTML, not the portfolio document. The backend downloads the underlying publicly readable file, rejects HTML, bounds downloaded/context size, and excludes excess history. Groq calls use finite deadlines, bounded output, and no tools. Missing credentials or provider failures return 503; simulated successful answers are removed. Rejected authentication/quota requests may rotate to another configured key; ambiguous timeouts are not retried.

The current knowledge mechanism is a bounded cached text prompt, not pgvector RAG. Source changes become visible after backend restart. Prefer a stable raw Markdown URL for production.

### Security and resource boundaries

- `GET /api/v1/security/csrf` establishes the XSRF cookie. Unsafe requests require the matching header.
- `POST /api/v1/visitors` records browser language/time zone plus server-observed address and bounded User-Agent. It returns no visitor bearer token. No browser fingerprint is collected.
- Chat messages/history require an owned visitor session. A conversation identifier alone grants no access.
- Rate limits, one generation per visitor at a time, two per-instance generation slots, and a daily attempt cap bound AI use.
- Rate limits/counters and sessions currently live in one JVM. Restarts expire sessions/reset quotas; do not scale to multiple instances without shared enforcement/session storage. Also configure provider-side spend limits.
- IP storage uses the socket peer address and does not trust arbitrary `X-Forwarded-For`. Behind a proxy this may be the proxy address; configure a reviewed trusted-proxy policy before relying on it as a real visitor IP. Network limits may group callers behind the same proxy.
- Public writes have a 16 KiB body limit; administrator blog bodies have a 256 KiB limit. Blog lists are bounded and published-only.
- Contact submission commits before a scheduled worker sends mail. Delivery claims/retries are bounded. Without mail credentials, accepted contacts remain PENDING rather than being falsely marked SENT. Provider acceptance is not proof of inbox delivery; a crash after provider acceptance can still cause a duplicate notification.
- `/api/v1/admin/users` lists minimal visitor records; `PATCH /api/v1/admin/users/{id}/block` supports blocking/unblocking. These are administrator-only APIs.
- Public health is minimal; other Actuator data requires administrator authority.
- API responses use `Cross-Origin-Resource-Policy: same-origin` to restrict cross-origin `no-cors` resource loads. Angular's CORS-enabled HTTP requests continue to use the configured origin allowlist; CORP does not replace CORS or authentication.
- Unsupported HTTP methods and missing routes return sanitized 405/404 responses, preserving protocol headers such as `Allow`. Unexpected failures retain a generic 500 body; implementation details are logged on the server.

## WHEN - Verification and rollout

Run backend tests only against an isolated test database. Test defaults point to `localhost:5544/vtthanh_test`, user `vtthanh_test`, password `test-only-password`. Override with `TEST_DATABASE_URL`, `TEST_DATABASE_USERNAME`, and `TEST_DATABASE_PASSWORD` in an isolated environment. These tests clean test records; never point them to a live database.

Run `gradlew test spotlessCheck checkstyleMain` from the backend project with JDK 25. CI provisions a separate PostgreSQL test service and runs backend/frontend tests before building release images.

The local audit script keeps ZAP warning exit codes enabled: 0 means no FAIL/WARN alerts in the scanned scope, 1 means FAIL alerts, 2 means WARN alerts, and 3 means a scan error. A passing passive baseline does not establish coverage of authenticated chat POST workflows; the integration tests exercise those separately. See the [ZAP baseline documentation](https://www.zaproxy.org/docs/docker/baseline-scan/).

Deploy the backend image and frontend changes together. After rollout, verify cookie/XSRF registration, one live chat reply, empty/nonempty blog responses, admin authorization, and both success/failure contact paths. Review the remaining [instruction audit](../docs/instruction/HOTFIX-REVIEW.md) before treating the entire original guide as complete.
