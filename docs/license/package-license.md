# Package License Matrix

Last reviewed: 2026-10-26.

Scope: direct dependencies and build plugins in the active frontend, backend, Python, and Go manifests; the explicit frontend Vite override; and project-local agent skills recorded in `agents.toml`, `agents.lock`, and `skills-lock.json`. Archived applications, other transitive dependencies, globally installed skills, and editor/agent applications are outside this table.

Frontend license identifiers are taken from `frontend/V.T.Thanh-Home-Angular/package-lock.json` where available. `No` in the final column means no apparent conflict from using the dependency under its own license alongside this MIT project; it does not mean the dependency becomes MIT-licensed or that attribution, notice, source-disclosure, or distribution obligations have been audited. `Review` identifies missing or version-unverified license evidence.

| Name | Backend / Frontend / Tools / Agent Skills | Location | Usage | License Type | MIT Violation (Yes/No/Review) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `requests` | Tools | `pyproject.toml` | HTTP library for automation scripts and tools | Apache-2.0 | No |
| `uv_build` | Tools | `pyproject.toml` | PEP 517 build backend for uv packaging | MIT or Apache-2.0 | No |
| `pre-commit` | Tools | `pyproject.toml` | Multi-language pre-commit hooks runner | MIT | No |
| `github.com/magefile/mage` | Tools | `go.mod` / `magefile.go` | Go-based build tool and task runner | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-actuator` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Application monitoring, health checks, and metrics | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-data-jpa` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | SQL persistence and JPA data repository layer | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-webmvc` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | RESTful API endpoints and MVC framework | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-flyway` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Database migration management integration | Apache-2.0 | No |
| `org.flywaydb:flyway-database-postgresql` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Flyway database driver extensions for PostgreSQL | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-security` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Authentication and authorization control | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-devtools` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Development-time live reload and diagnostics | Apache-2.0 | No |
| `org.postgresql:postgresql` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | PostgreSQL JDBC driver | BSD-2-Clause | No |
| `org.springframework.boot:spring-boot-starter-actuator-test` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Testing support for actuator endpoints | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-data-jpa-test` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Testing harness for JPA repositories | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-webmvc-test` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Web layer and controller testing utilities | Apache-2.0 | No |
| `org.springframework.boot:spring-boot-starter-security-test` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Security context and authentication testing | Apache-2.0 | No |
| `org.junit.platform:junit-platform-launcher` | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Test launcher engine for JUnit platform | EPL-2.0 | No |
| `org.springframework.boot` (Gradle plugin) | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Spring Boot Gradle build plugin | Apache-2.0 | No |
| `io.spring.dependency-management` (Gradle plugin) | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | BOM dependency management Gradle plugin | Apache-2.0 | No |
| `com.diffplug.spotless` (Gradle plugin) | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Code formatting enforcement plugin | Apache-2.0 | No |
| `com.autonomousapps.dependency-analysis` (Gradle plugin, 3.19.2) | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Dependency usage analysis and configuration advice | [Apache-2.0](https://github.com/autonomousapps/dependency-analysis-gradle-plugin/blob/v3.19.2/LICENSE.txt) | No |
| `checkstyle` (Gradle plugin tool) | Backend | `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` | Java static analysis and code style auditing | LGPL-2.1 | No |
| `@angular/common` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Core Angular directives and pipes | MIT | No |
| `@angular/compiler` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Angular template and component compiler | MIT | No |
| `@angular/core` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Core Angular framework and runtime | MIT | No |
| `@angular/forms` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Reactive and template-driven forms | MIT | No |
| `@angular/platform-browser` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Browser rendering pipeline for Angular | MIT | No |
| `@angular/router` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Client-side routing and navigation | MIT | No |
| `@vercel/analytics` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Web traffic and interaction analytics tracking | MIT | No |
| `@vercel/speed-insights` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Real-user performance and Web Vitals measurements | Apache-2.0 | No |
| `botid` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Client-side bot and agent detection | Undeclared in lockfile and [npm metadata for 1.5.11](https://registry.npmjs.org/botid/1.5.11); verify distributed license and applicable terms | Review |
| `dompurify` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Sanitize untrusted HTML before rendering | MPL-2.0 OR Apache-2.0 | No |
| `marked` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Parse Markdown content into HTML | MIT | No |
| `rxjs` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Reactive programming library using Observables | Apache-2.0 | No |
| `three` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | 3D graphics and WebGL rendering library | MIT | No |
| `tslib` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | TypeScript runtime helper functions | 0BSD | No |
| `@angular/build` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Angular CLI application builder pipeline | MIT | No |
| `@angular/cli` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Command-line interface for Angular | MIT | No |
| `@angular/compiler-cli` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Ahead-of-time compilation tool for Angular | MIT | No |
| `@eslint/js` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | ESLint JavaScript core rules | MIT | No |
| `@tailwindcss/postcss` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | PostCSS plugin for Tailwind CSS | MIT | No |
| `@types/dompurify` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | TypeScript compatibility declarations for DOMPurify | MIT | No |
| `@types/three` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | TypeScript type declarations for Three.js | MIT | No |
| `angular-eslint` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | ESLint integration and rules for Angular | MIT | No |
| `eslint` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | JavaScript/TypeScript linter | MIT | No |
| `jsdom` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Pure JavaScript implementation of WHATWG DOM | MIT | No |
| `postcss` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | CSS transformation tool via JavaScript plugins | MIT | No |
| `prettier` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Opinionated code formatter | MIT | No |
| `tailwindcss` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Utility-first CSS framework | MIT | No |
| `typescript` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Typed superset of JavaScript language and compiler | Apache-2.0 | No |
| `typescript-eslint` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Tooling to enable ESLint on TypeScript | MIT | No |
| `vitest` | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` | Vite-native unit testing framework | MIT | No |
| `vite` (override, 8.3.5) | Frontend | `frontend/V.T.Thanh-Home-Angular/package.json` / `package-lock.json` | Explicit override of the Angular builder's Vite dependency | MIT | No |
| `dotagents` (skill) | Agent Skills | `.agents/skills/dotagents/`; `agents.toml`; `agents.lock` | Manage agent dependencies and configuration; source `getsentry/dotagents`, commit `0899a97d8bff86644331f14c2053236a78d891ca` | [MIT](https://github.com/getsentry/dotagents/blob/0899a97d8bff86644331f14c2053236a78d891ca/LICENSE.md) | No |
| `security-audit` (skill) | Agent Skills | `.agents/skills/security-audit/`; `skills-lock.json` | Security review guidance and report validation; source `cloudflare/security-audit-skill` | [MIT](https://github.com/cloudflare/security-audit-skill/blob/main/LICENSE) (current upstream; installed revision not pinned) | Review |
| `sentry-cli` (skill, 0.47.0) | Agent Skills | `.agents/skills/sentry-cli/`; `agents.toml`; `agents.lock` | Guide agents using the `sentry` CLI; downloaded from `https://cli.sentry.dev` | Installed skill license unverified; current linked upstream [toolkit license](https://github.com/getsentry/toolkit/blob/main/LICENSE.md) is FSL-1.1-Apache-2.0 | Review |

## Agent skill evidence and follow-up

`dotagents` has an immutable source commit in `agents.lock`, and its license was checked at that commit. `security-audit` has a content hash in `skills-lock.json` but no upstream commit; the linked MIT license is evidence for current upstream, not a verified match for the installed snapshot.

The installed `sentry-cli` skill declares version `0.47.0`, while `agents.lock` records only its download URL. The [download site's GitHub link](https://cli.sentry.dev/) currently points to `getsentry/toolkit`. Its current FSL license must not be treated as a verified license for the downloaded skill or confused with the separate `getsentry/sentry-cli` project. Confirm the license covering the installed skill before redistribution; the current upstream license includes permitted-purpose restrictions and a future Apache-2.0 grant after two years for each release.

For `botid`, the previous MIT classification could not be substantiated from the installed lockfile or version-specific registry metadata. Check the package distribution and vendor terms before assigning a license identifier.
