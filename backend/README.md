# Backend: Spring Boot API

## WHAT

The backend release version is **1.0.2**. It uses Spring Boot **4.1.1**, JDK **25**, Spring MVC, Spring Security, Spring Data JPA, PostgreSQL, and Flyway. Virtual threads are enabled. The Gradle wrapper specifies **9.8.1**; the application builds as `app.jar`. Dependency versions and overrides are defined in [build.gradle.kts](V.T.Thanh-Home-SpringBoot/build.gradle.kts).

The API serves visitor registration, session-owned Groq chat, published projects and blogs, contact submissions, and administrator operations. Angular uses relative URLs under `/api/v1`. Its development server and Vercel forward those requests to Spring Boot. The browser keeps a server session cookie; visitor credentials are not stored in browser storage. The public Angular project page currently displays six static projects independently of the project API.

| Area | Routes and behavior |
|---|---|
| Public configuration | `GET /api/v1/security/csrf` and `GET /api/v1/security/config` |
| Visitors | `POST /api/v1/visitors` registers browser metadata in the server session |
| Public content | `GET /api/v1/projects`, `GET /api/v1/projects/{slug}`, `GET /api/v1/blogs`, and `GET /api/v1/blogs/{slug}` |
| Chat | `POST /api/v1/chat/session`, `POST /api/v1/chat/message`, and `GET /api/v1/chat/history` |
| Contact | `POST /api/v1/contacts` persists a submission for asynchronous email delivery |
| Administration | `/api/v1/admin/login`, `/logout`, `/session`, `/projects`, `/blogs`, `/contacts`, and `/users`, under the same admin prefix |
| Operations | Public `/actuator/health` and health probes; administrator-only `/actuator/info` and `/actuator/metrics` |

## WHY

The same-origin proxy avoids cross-site cookie restrictions and allows Angular's built-in XSRF handling. Backend credentials must reach the backend process, not the frontend bundle. A root `.env` supplies Compose interpolation; it is not automatically a Spring Boot environment.

Flyway owns schema changes, while Hibernate validates the migrated schema. Contact acceptance is separate from email delivery so a mail-provider failure does not discard the stored submission. Chat ownership, request IDs, and bounded concurrency prevent a conversation identifier or repeated request from granting unrestricted access to generation.

## HOW

### Local development

1. Populate the repository-root `.env` using [.env.example](../.env.example). Set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, local `SERVER_PORT=8080`, and `SPRING_PROFILES_ACTIVE=dev`. Set `APP_CORS_ALLOWED_ORIGINS=http://localhost:4200`. Configure at least one Groq key (`GROQ_API_KEY` or `GROQ_API_KEYS`) to use chat. Keep the file private.
2. From the repository root run `docker compose up --build -d backend`.
3. In `frontend/V.T.Thanh-Home-Angular`, run `npm ci` when dependencies need installing, then `npm start`.
4. Open `http://localhost:4200`. The dev proxy forwards `/api/v1/**` and `/actuator/**` to `http://localhost:8080`.
5. Keep the container's `SERVER_PORT=8080` with the current Compose port mapping. Compose maps the host `${SERVER_PORT}` to container port `8080`; selecting a different application port also requires adjusting that mapping and the frontend proxy.

Compose explicitly forwards Groq, knowledge-file, mail, administrator, and Turnstile settings. It overrides secure session cookies for local HTTP. Local email delivery defaults off (`CONTACT_EMAIL_DELIVERY_ENABLED=false`); enable it explicitly when ready to send queued notifications. Local Turnstile defaults off unless `TURNSTILE_ENABLED=true`; that is an explicit local setting, not a bypass on failed production verification.

For direct execution, start only the database with `docker compose up -d db` from the repository root. Export the application variables into your shell, including `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:<POSTGRES_PORT>/<POSTGRES_DB>`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, and a non-production profile for local HTTP. Run `./gradlew bootRun` on Linux/macOS or `.\gradlew.bat bootRun` on Windows from `backend/V.T.Thanh-Home-SpringBoot`. Spring does not read arbitrary `.env` files. The YAML database fallback uses port `5433`, database `vtthanh_db`, username `vtthanh_user`, and an empty password; supply the actual credentials. The mail worker defaults on in application YAML, so explicitly set `CONTACT_EMAIL_DELIVERY_ENABLED=false` when direct local execution should not send mail.

### Production on Render

Use the repository root as the Docker build context and [backend/Dockerfile](Dockerfile) as the Dockerfile, or deploy the image published by the backend deployment workflow. For a local image build, run `docker build -t vtthanh-backend:local -f backend/Dockerfile .` from the repository root.

The Docker build packages `app.jar` and uses `backend/Dockerfile.dockerignore` to include only backend build inputs. Production dependency artifacts are resolved before application sources are copied, so source-only changes can reuse that layer. Tests run separately in CI and are not included in the image build context.

The Temurin JDK and JRE defaults are pinned by digest in `backend/Dockerfile`. When updating Java, verify both image manifests, update both digests together, rebuild, scan the runtime image, and rerun database-backed startup checks. The build arguments are named `TEMURIN_JDK_VERSION` and `TEMURIN_JRE_VERSION`.

The runtime uses the Temurin 25 JRE on Ubuntu Noble and runs as UID/GID `1001:1001`. The container entrypoint selects `PORT`, then `SERVER_PORT`, then `8080`, and exports the selected value as `SERVER_PORT` before replacing the shell with Java. This keeps Spring's environment-property binding aligned with the Docker health check even when both port variables are supplied. `JAVA_TOOL_OPTIONS` is `-XX:MaxRAMPercentage=70.0 -XX:TieredStopAtLevel=1`; no initial heap percentage is configured. The heap limit does not include all native JVM memory. Override these settings in the runtime environment when benchmarking startup against peak request performance.

Supply the following in Render's environment settings:

| Setting | Value/purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | Reachable PostgreSQL JDBC URL, with the deployment's required TLS parameters |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Database credentials |
| `GROQ_API_KEY` or `GROQ_API_KEYS` | One key or a comma-separated/JSON-array key list; server-only |
| `CHAT_MODEL` | Default `openai/gpt-oss-120b`; choose a model available to the configured key |
| `CHAT_FILE_URL` | Public UTF-8 text/Markdown knowledge document; Google Drive `/file/d/.../view` URLs are converted to download URLs |
| `CHAT_DAILY_GENERATION_LIMIT` | Initial per-instance cap, default 200 attempts/day in UTC |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Optional account bootstrap when the configured username does not exist; password 12–512 characters, username at most 50; changing the password does not reset an existing account |
| `APP_CORS_ALLOWED_ORIGINS` | Exact browser origins, including `https://www.juniorthanh.id.vn`; add any custom domain explicitly |
| `TURNSTILE_ENABLED` | Defaults to `true` in the `prod` profile; explicitly enable it for production contact/chat protection |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Corresponding widget keys; secret stays on Render |
| `TURNSTILE_HOSTNAMES` | Comma-separated exact frontend hostnames, without scheme/path; match Cloudflare widget configuration |
| `CONTACT_EMAIL_DELIVERY_ENABLED` | Application default `true`; set `false` when notification delivery should be disabled |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Gmail OAuth credentials when contact email delivery is enabled |
| `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME`, `EMAILS_RECIPIENT_EMAIL` | Verified sender identity and fixed recipient |

Render's injected `PORT` takes precedence over `SERVER_PORT`; the Docker health check uses the same port selection. The production profile uses Secure, HttpOnly, SameSite=Lax session cookies. Requests must come through the HTTPS frontend proxy. Do not use a direct cross-site API URL for Angular.

The standalone [production Compose file](../docker-compose.prod.yml) connects to an external database and starts no database service. Run it explicitly with `docker compose -f docker-compose.prod.yml up --build -d backend`. It sets `TURNSTILE_ENABLED=false` unless overridden, even though the Spring `prod` profile defaults to `true`; configure the desired production value explicitly. Compose maps `CONTACT_EMAIL_DELIVERY_ENABLED` to `APP_MAIL_WORKER_ENABLED`; direct Render execution uses `CONTACT_EMAIL_DELIVERY_ENABLED` through application YAML. The `prod` profile fixes secure cookies to `true`.

Flyway runs migrations before Hibernate's `validate`. V5 adds visitor metadata, chat ownership/request state, and scoped contact idempotency. Existing chat records have no visitor owner and are intentionally inaccessible to newly registered browser sessions. Do not edit applied migrations or delete database volumes to resolve validation failures.

### Groq and knowledge troubleshooting

The configured model is a source default, not a guarantee of provider access. Check the selected model against the configured account when diagnosing provider failures. The Groq client sets a 3-second connection timeout and a 25-second read timeout.

A Drive preview is HTML, not the portfolio document. The backend downloads the underlying publicly readable file, rejects HTML, bounds downloaded/context size, and excludes excess history. Groq calls use finite deadlines, bounded output, and no tools. Missing credentials or provider failures return 503. Rejected authentication/quota requests may rotate to another configured key; ambiguous timeouts are not retried.

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
- Both Spring Security and MVC CORS configurations allow the browser request headers `Content-Type` and `X-XSRF-TOKEN`. The example origin list includes `http://localhost:4200`, `http://127.0.0.1:4200`, `https://www.juniorthanh.id.vn`, and `https://vtthanh-home-angular.vercel.app`. Set `APP_CORS_ALLOWED_ORIGINS` explicitly for the deployment. Turnstile tokens and contact idempotency keys are JSON fields; Groq/Gmail authorization headers and Supabase database connections are server-side and do not need browser CORS permissions. The email implementation uses the Gmail HTTPS API on port 443; the example `SMTP_*` values are not consumed by that implementation.
- Sessions expire after 30 minutes of inactivity. Hikari uses a maximum of 10 connections, a minimum idle target of 2, and a 20-second connection acquisition timeout. Startup includes database connectivity, Flyway, and Hibernate validation.
- API responses use `Cross-Origin-Resource-Policy: same-origin` to restrict cross-origin `no-cors` resource loads. Angular's CORS-enabled HTTP requests continue to use the configured origin allowlist; CORP does not replace CORS or authentication.
- Unsupported HTTP methods and missing routes return sanitized 405/404 responses, preserving protocol headers such as `Allow`. Unexpected failures retain a generic 500 body; implementation details are logged on the server.

## WHEN

### Before merging or deploying

Run backend tests only against an isolated test database. Test defaults point to `localhost:5544/vtthanh_test`, user `vtthanh_test`, password `test-only-password`. Override with `TEST_DATABASE_URL`, `TEST_DATABASE_USERNAME`, and `TEST_DATABASE_PASSWORD` in an isolated environment. These tests clean test records; never point them to a live database.

Run `./gradlew test spotlessCheck checkstyleMain` on Linux/macOS or `.\gradlew.bat test spotlessCheck checkstyleMain` on Windows from the backend project with JDK 25. CI provisions a separate PostgreSQL test service and runs backend tests and frontend lint/build checks before building release images. Frontend tests run only when `.spec.ts` files exist.

Dependency declaration analysis uses `com.autonomousapps.dependency-analysis` **3.19.2** with issue severity explicitly set to `warn`. Run `./gradlew buildHealth` or `.\gradlew.bat buildHealth` from the backend project to generate advice under `build/reports/dependency-analysis`. Findings are advisory; task execution errors still fail the command. Review Spring Boot auto-configuration and runtime discovery before removing dependencies. This task is invoked separately and is not added to the existing CI commands. It checks dependency usage rather than known vulnerabilities. OWASP Dependency-Check is not configured.

The [local audit script](../scripts/app-security-audit.sh) runs dependency, source, and passive web scans. A passing passive baseline does not establish coverage of authenticated chat POST workflows; integration tests exercise those separately. The CI Trivy job reports High/Critical findings to SARIF without an explicit nonzero vulnerability exit code, and ZAP uses `fail_action: false`. A green pipeline is not proof of zero security findings.

### After deployment or configuration changes

Deploy compatible backend and frontend releases together when changing API contracts. Verify cookie/XSRF registration, one live chat reply, empty/nonempty blog responses, administrator authorization, contact persistence, and email delivery separately. Recheck CORS, proxy destinations, and Turnstile hostnames after domain changes.

The frontend's standby message gives a two-minute startup estimate; it is not a readiness guarantee. Its health polling allows up to 120 seconds per request. The separate hourly GitHub health probe currently times out after 45 seconds, so a cold start can produce an `Unreachable` badge even while startup is still progressing.

The hourly health workflow also scans the published `juniorthanh09/vtthanh-backend:latest` image for `linux/amd64` with Docker Scout. `DOCKER_USERNAME` and `DOCKER_TOKEN` Actions secrets are required. The README badge reports Critical/High/Medium/Low/Unspecified counts or `unavailable`; it describes the published image rather than proving which digest is deployed. See the [frontend guide](../frontend/README.md) for browser-side readiness behavior.
