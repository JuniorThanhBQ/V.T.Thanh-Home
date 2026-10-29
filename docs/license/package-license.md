# Package License Matrix

Last reviewed: 2026-10-29.

## Scope and interpretation

This inventory reflects the active repository after the v3.0.0 upgrade. Versions come from manifests and committed lockfiles, rather than the version of the application itself. The frontend declares 3.0.0, the backend declares 1.0.2 with Spring Boot 4.1.1 and JDK 25, and the current Python manifest declares 3.0.1. These version numbers are independent.

Included: all direct frontend dependencies and development dependencies; explicit npm overrides; direct backend dependencies, build plugins, and explicit dependency version constraints; Python dependencies and the committed Python dependency closure; Go tooling; pre-commit hooks; every external GitHub Actions repository/ref pair; explicitly referenced scanning tools and container/runtime components; project-local agent skills; and the bundled Inter font.

Excluded: archived applications under `archives/`, the complete npm/Gradle transitive graphs, every operating-system package inside container images, globally installed skills, editor extensions, and the implementation dependencies of hosted services. This is an inventory with review flags, not an SBOM or a completed distribution compliance audit.

**Status:** `No apparent conflict` means the recorded license presents no apparent conflict with using this component for its documented purpose alongside the MIT project, subject to its own conditions. `Review` means missing snapshot evidence, source-available/commercial restrictions, or distribution-specific obligations need a decision. Neither status relicenses dependencies as MIT or proves that a violation exists. The old “MIT Violation” column has been replaced because license metadata alone cannot establish legal compliance.

Evidence links point to versioned package metadata, Maven POMs, or immutable action commits where available. Local lockfile metadata is a declaration, not proof that all bundled third-party notices were examined. Current upstream evidence is explicitly identified where an installed revision cannot be established.

## Frontend packages

| Package | Declared range | Locked version | Usage | License / evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **dependencies** |  |  |  |  |  |
| `@angular/common` | `^22.2.2` | `22.2.3` | Core Angular directives and pipes | [MIT](https://registry.npmjs.org/%40angular%2Fcommon/22.2.3) | No apparent conflict |
| `@angular/compiler` | `^22.2.2` | `22.2.3` | Angular template and component compiler | [MIT](https://registry.npmjs.org/%40angular%2Fcompiler/22.2.3) | No apparent conflict |
| `@angular/core` | `^22.2.2` | `22.2.3` | Core Angular framework and runtime | [MIT](https://registry.npmjs.org/%40angular%2Fcore/22.2.3) | No apparent conflict |
| `@angular/forms` | `^22.2.2` | `22.2.3` | Reactive and template-driven forms | [MIT](https://registry.npmjs.org/%40angular%2Fforms/22.2.3) | No apparent conflict |
| `@angular/platform-browser` | `^22.2.2` | `22.2.3` | Browser rendering pipeline for Angular | [MIT](https://registry.npmjs.org/%40angular%2Fplatform-browser/22.2.3) | No apparent conflict |
| `@angular/router` | `^22.2.2` | `22.2.3` | Client-side routing and navigation | [MIT](https://registry.npmjs.org/%40angular%2Frouter/22.2.3) | No apparent conflict |
| `@angular/service-worker` | `22.2.3` | `22.2.3` | Offline caching and Angular PWA worker | [MIT](https://registry.npmjs.org/%40angular%2Fservice-worker/22.2.3) | No apparent conflict |
| `@sentry/angular` | `^11.9.0` | `11.9.0` | Angular error and performance instrumentation | [MIT](https://registry.npmjs.org/%40sentry%2Fangular/11.9.0) | No apparent conflict |
| `@vercel/analytics` | `^2.0.1` | `2.0.1` | Web traffic and interaction analytics tracking | [MIT](https://registry.npmjs.org/%40vercel%2Fanalytics/2.0.1) | No apparent conflict |
| `@vercel/speed-insights` | `^2.0.0` | `2.0.0` | Real-user performance and Web Vitals measurements | [Apache-2.0](https://registry.npmjs.org/%40vercel%2Fspeed-insights/2.0.0) | No apparent conflict |
| `botid` | `^1.5.11` | `1.5.11` | Client-side bot and agent detection | [Undeclared](https://registry.npmjs.org/botid/1.5.11) | Review |
| `dompurify` | `^3.4.17` | `3.4.17` | Sanitize untrusted HTML before rendering | [(MPL-2.0 OR Apache-2.0)](https://registry.npmjs.org/dompurify/3.4.17) | No apparent conflict |
| `marked` | `^18.1.1` | `18.1.1` | Parse Markdown content into HTML | [MIT](https://registry.npmjs.org/marked/18.1.1) | No apparent conflict |
| `rxjs` | `~7.8.0` | `7.8.2` | Reactive programming library using Observables | [Apache-2.0](https://registry.npmjs.org/rxjs/7.8.2) | No apparent conflict |
| `three` | `^0.186.1` | `0.186.1` | 3D graphics and WebGL rendering library | [MIT](https://registry.npmjs.org/three/0.186.1) | No apparent conflict |
| `tslib` | `^2.3.0` | `2.8.1` | TypeScript runtime helper functions | [0BSD](https://registry.npmjs.org/tslib/2.8.1) | No apparent conflict |
| **devDependencies** |  |  |  |  |  |
| `@angular/build` | `^22.2.2` | `22.2.3` | Angular CLI application builder pipeline | [MIT](https://registry.npmjs.org/%40angular%2Fbuild/22.2.3) | No apparent conflict |
| `@angular/cli` | `^22.2.2` | `22.2.3` | Command-line interface for Angular | [MIT](https://registry.npmjs.org/%40angular%2Fcli/22.2.3) | No apparent conflict |
| `@angular/compiler-cli` | `^22.2.2` | `22.2.3` | Ahead-of-time compilation tool for Angular | [MIT](https://registry.npmjs.org/%40angular%2Fcompiler-cli/22.2.3) | No apparent conflict |
| `@eslint/js` | `^10.0.1` | `10.0.1` | ESLint JavaScript core rules | [MIT](https://registry.npmjs.org/%40eslint%2Fjs/10.0.1) | No apparent conflict |
| `@playwright/test` | `1.64.1` | `1.64.1` | Repeatable PWA browser regression tests | [Apache-2.0](https://registry.npmjs.org/%40playwright%2Ftest/1.64.1) | No apparent conflict |
| `@sentry/cli` | `^3.8.2` | `3.8.2` | Build-time source map processing and upload | [FSL-1.1-MIT](https://registry.npmjs.org/%40sentry%2Fcli/3.8.2) | Review |
| `@tailwindcss/postcss` | `^4.1.12` | `4.3.3` | PostCSS plugin for Tailwind CSS | [MIT](https://registry.npmjs.org/%40tailwindcss%2Fpostcss/4.3.3) | No apparent conflict |
| `@types/node` | `26.6.5` | `26.6.5` | Node API types for scripts and browser test tooling | [MIT](https://registry.npmjs.org/%40types%2Fnode/26.6.5) | No apparent conflict |
| `@types/three` | `^0.186.0` | `0.186.0` | TypeScript type declarations for Three.js | [MIT](https://registry.npmjs.org/%40types%2Fthree/0.186.0) | No apparent conflict |
| `@vercel/routing-utils` | `6.6.0` | `6.6.0` | Validate Vercel hosting routes | [Apache-2.0](https://registry.npmjs.org/%40vercel%2Frouting-utils/6.6.0) | No apparent conflict |
| `angular-eslint` | `22.6.0` | `22.6.0` | ESLint integration and rules for Angular | [MIT](https://registry.npmjs.org/angular-eslint/22.6.0) | No apparent conflict |
| `eslint` | `^10.9.1` | `10.13.0` | JavaScript/TypeScript linter | [MIT](https://registry.npmjs.org/eslint/10.13.0) | No apparent conflict |
| `jsdom` | `^30.1.2` | `30.1.3` | Pure JavaScript implementation of WHATWG DOM | [MIT](https://registry.npmjs.org/jsdom/30.1.3) | No apparent conflict |
| `postcss` | `^8.5.29` | `8.5.31` | CSS transformation tool via JavaScript plugins | [MIT](https://registry.npmjs.org/postcss/8.5.31) | No apparent conflict |
| `prettier` | `^3.9.10` | `3.9.10` | Opinionated code formatter | [MIT](https://registry.npmjs.org/prettier/3.9.10) | No apparent conflict |
| `tailwindcss` | `^4.1.12` | `4.3.3` | Utility-first CSS framework | [MIT](https://registry.npmjs.org/tailwindcss/4.3.3) | No apparent conflict |
| `typescript` | `~6.0.2` | `6.0.3` | Typed superset of JavaScript language and compiler | [Apache-2.0](https://registry.npmjs.org/typescript/6.0.3) | No apparent conflict |
| `typescript-eslint` | `8.72.0` | `8.72.0` | Tooling to enable ESLint on TypeScript | [MIT](https://registry.npmjs.org/typescript-eslint/8.72.0) | No apparent conflict |
| `vitest` | `^5.0.0` | `5.0.5` | Vite-native unit testing framework | [MIT](https://registry.npmjs.org/vitest/5.0.5) | No apparent conflict |

Location: `frontend/V.T.Thanh-Home-Angular/package.json` and `frontend/V.T.Thanh-Home-Angular/package-lock.json`. `@types/dompurify` is no longer a direct dependency and has been removed from this matrix. `@sentry/cli` is a build tool under FSL-1.1-MIT, distinct from the MIT Sentry SDKs and the separately downloaded `sentry` agent CLI.

## Explicit npm overrides and CI bootstrap

| Package | Resolved version | Location / purpose | License / evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `vite` | `8.3.5` | `frontend/V.T.Thanh-Home-Angular/package.json`; override beneath `@angular/build` | [MIT](https://registry.npmjs.org/vite/8.3.5) | No apparent conflict |
| `path-to-regexp` | `6.3.0` | `frontend/V.T.Thanh-Home-Angular/package.json`; override beneath `@vercel/routing-utils` | [MIT](https://registry.npmjs.org/path-to-regexp/6.3.0) | No apparent conflict |
| `npm` | `12.2.1` | `.github/tooling/npm/package.json` and lockfile; CI npm bootstrap | [Artistic-2.0](https://registry.npmjs.org/npm/12.2.1) | No apparent conflict |

## Backend direct dependencies

| Maven coordinate | Locked version | Usage | License / evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `io.sentry:sentry-spring-boot-4-starter` | `8.61.1` | Spring Boot error and performance instrumentation | [MIT](https://repo.maven.apache.org/maven2/io/sentry/sentry-spring-boot-4-starter/8.61.1/sentry-spring-boot-4-starter-8.61.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-actuator` | `4.1.1` | Application monitoring, health checks, and metrics | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-actuator/4.1.1/spring-boot-starter-actuator-4.1.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-data-jpa` | `4.1.1` | SQL persistence and JPA data repository layer | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-data-jpa/4.1.1/spring-boot-starter-data-jpa-4.1.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-webmvc` | `4.1.1` | RESTful API endpoints and MVC framework | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-webmvc/4.1.1/spring-boot-starter-webmvc-4.1.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-flyway` | `4.1.1` | Database migration management integration | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-flyway/4.1.1/spring-boot-starter-flyway-4.1.1.pom) | No apparent conflict |
| `org.flywaydb:flyway-database-postgresql` | `12.4.0` | Flyway database driver extensions for PostgreSQL | [Apache-2.0](https://repo.maven.apache.org/maven2/org/flywaydb/flyway-parent/12.4.0/flyway-parent-12.4.0.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-security` | `4.1.1` | Authentication and authorization control | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-security/4.1.1/spring-boot-starter-security-4.1.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-devtools` | `4.1.1` | Development-time live reload and diagnostics | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-devtools/4.1.1/spring-boot-devtools-4.1.1.pom) | No apparent conflict |
| `org.postgresql:postgresql` | `42.7.13` | PostgreSQL JDBC driver | [BSD-2-Clause](https://repo.maven.apache.org/maven2/org/postgresql/postgresql/42.7.13/postgresql-42.7.13.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-actuator-test` | `4.1.1` | Testing support for actuator endpoints | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-actuator-test/4.1.1/spring-boot-starter-actuator-test-4.1.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-data-jpa-test` | `4.1.1` | Testing harness for JPA repositories | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-data-jpa-test/4.1.1/spring-boot-starter-data-jpa-test-4.1.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-webmvc-test` | `4.1.1` | Web layer and controller testing utilities | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-webmvc-test/4.1.1/spring-boot-starter-webmvc-test-4.1.1.pom) | No apparent conflict |
| `org.springframework.boot:spring-boot-starter-security-test` | `4.1.1` | Security context and authentication testing | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-security-test/4.1.1/spring-boot-starter-security-test-4.1.1.pom) | No apparent conflict |
| `org.junit.platform:junit-platform-launcher` | `6.0.3` | Test launcher engine for JUnit platform | [EPL-2.0](https://repo.maven.apache.org/maven2/org/junit/platform/junit-platform-launcher/6.0.3/junit-platform-launcher-6.0.3.pom) | No apparent conflict |

Location: `backend/V.T.Thanh-Home-SpringBoot/build.gradle.kts` and `backend/V.T.Thanh-Home-SpringBoot/gradle.lockfile`. Flyway’s license declaration is inherited from its versioned parent POM.

## Backend build tools and explicit version constraints

| Component | Version | Purpose | License / evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `org.springframework.boot Gradle plugin` | `4.1.1` | Spring Boot packaging | [Apache-2.0](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-gradle-plugin/4.1.1/spring-boot-gradle-plugin-4.1.1.pom) | No apparent conflict |
| `io.spring.dependency-management` | `1.1.7` | BOM dependency management | [Apache-2.0](https://repo.maven.apache.org/maven2/io/spring/gradle/dependency-management-plugin/1.1.7/dependency-management-plugin-1.1.7.pom) | No apparent conflict |
| `com.diffplug.spotless` | `8.10.4` | Java formatting checks | [Apache-2.0](https://repo.maven.apache.org/maven2/com/diffplug/spotless/spotless-plugin-gradle/8.10.4/spotless-plugin-gradle-8.10.4.pom) | No apparent conflict |
| `com.autonomousapps.dependency-analysis` | `3.19.2` | Dependency usage analysis | [Apache-2.0](https://github.com/autonomousapps/dependency-analysis-gradle-plugin/blob/v3.19.2/LICENSE.txt) | No apparent conflict |
| `com.puppycrawl.tools:checkstyle` | `10.12.4` | Checkstyle tool invoked by Gradle’s built-in checkstyle plugin | [LGPL-2.1-or-later](https://repo.maven.apache.org/maven2/com/puppycrawl/tools/checkstyle/10.12.4/checkstyle-10.12.4.pom) | No apparent conflict |
| `Gradle wrapper / built-in java and checkstyle plugins` | `9.8.2` | Build runtime; gradle/wrapper/gradle-wrapper.properties | [Apache-2.0; bundled components retain their licenses](https://github.com/gradle/gradle/blob/v9.8.2/LICENSE) | No apparent conflict |
| `org.apache.tomcat.embed:tomcat-embed-core / tomcat-embed-el / tomcat-embed-websocket` | `11.0.25` | Explicit tomcat.version constraint | [Apache-2.0](https://repo.maven.apache.org/maven2/org/apache/tomcat/embed/tomcat-embed-core/11.0.25/tomcat-embed-core-11.0.25.pom) | No apparent conflict |
| `tools.jackson.core:jackson-core / jackson-databind; tools.jackson:jackson-bom` | `3.1.7` | Explicit Jackson resolution constraints | [Apache-2.0](https://repo.maven.apache.org/maven2/tools/jackson/core/jackson-core/3.1.7/jackson-core-3.1.7.pom) | No apparent conflict |
| `commons-beanutils:commons-beanutils` | `1.11.0` | Explicit Checkstyle transitive constraint | [Apache-2.0](https://repo.maven.apache.org/maven2/commons-beanutils/commons-beanutils/1.11.0/commons-beanutils-1.11.0.pom) | No apparent conflict |
| `org.codehaus.plexus:plexus-utils` | `3.6.1` | Explicit Checkstyle transitive constraint | [Apache-2.0](https://repo.maven.apache.org/maven2/org/codehaus/plexus/plexus-utils/3.6.1/plexus-utils-3.6.1.pom) | No apparent conflict |

## Python and Go script tooling

| Package | Version / constraint | Purpose / source | License / evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `certifi` | `2026.10.23` | Transitive Python tooling / HTTP dependency in uv.lock | [MPL-2.0](https://pypi.org/pypi/certifi/2026.10.23/json) | No apparent conflict |
| `cfgv` | `3.5.0` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/cfgv/3.5.0/json) | No apparent conflict |
| `charset-normalizer` | `3.5.2` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/charset-normalizer/3.5.2/json) | No apparent conflict |
| `distlib` | `0.4.4` | Transitive Python tooling / HTTP dependency in uv.lock | [PSF-2.0](https://pypi.org/pypi/distlib/0.4.4/json) | No apparent conflict |
| `filelock` | `4.2.4` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/filelock/4.2.4/json) | No apparent conflict |
| `identify` | `2.6.20` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/identify/2.6.20/json) | No apparent conflict |
| `idna` | `3.20` | Transitive Python tooling / HTTP dependency in uv.lock | [BSD-3-Clause](https://pypi.org/pypi/idna/3.20/json) | No apparent conflict |
| `nodeenv` | `1.11.0` | Transitive Python tooling / HTTP dependency in uv.lock | [BSD](https://pypi.org/pypi/nodeenv/1.11.0/json) | No apparent conflict |
| `packaging` | `26.3` | Transitive Python tooling / HTTP dependency in uv.lock | [Apache-2.0 OR BSD-2-Clause](https://pypi.org/pypi/packaging/26.3/json) | No apparent conflict |
| `platformdirs` | `4.13.5` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/platformdirs/4.13.5/json) | No apparent conflict |
| `pre-commit` | `4.7.0` | Direct development dependency; manifest >=4.6.2 | [MIT](https://pypi.org/pypi/pre-commit/4.7.0/json) | No apparent conflict |
| `python-discovery` | `1.6.4` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/python-discovery/1.6.4/json) | No apparent conflict |
| `pyyaml` | `6.0.3` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/pyyaml/6.0.3/json) | No apparent conflict |
| `requests` | `2.34.2` | Direct script HTTP dependency; manifest >=2.34.2 | [Apache-2.0](https://pypi.org/pypi/requests/2.34.2/json) | No apparent conflict |
| `urllib3` | `2.8.0` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/urllib3/2.8.0/json) | No apparent conflict |
| `virtualenv` | `21.14.13` | Transitive Python tooling / HTTP dependency in uv.lock | [MIT](https://pypi.org/pypi/virtualenv/21.14.13/json) | No apparent conflict |
| `uv_build` | `>=0.12.21,<0.14.0` | PEP 517 build backend; not pinned by uv.lock | [MIT OR Apache-2.0 (current metadata; resolved build version unrecorded)](https://pypi.org/pypi/uv_build/json) | Review |
| `github.com/magefile/mage` | `v1.17.2` | go.mod; magefile.go task runner | [Apache-2.0](https://github.com/magefile/mage/blob/v1.17.2/LICENSE) | No apparent conflict |

`uv.lock` still identifies the local project as 2.2.3, while `pyproject.toml` declares 3.0.1. The table records the committed dependency versions without claiming the lockfile is synchronized. The `uv_build` build-system requirement is a range, not a resolved version. Python standard-library imports and Node `node:` imports are covered by their runtimes, rather than separate third-party package rows.

## Pre-commit hooks

| Repository / tool | Configured revision | Purpose | License / evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `pre-commit/pre-commit-hooks` | `v6.0.0` | Whitespace and file validation | [MIT](https://github.com/pre-commit/pre-commit-hooks/blob/v6.0.0/LICENSE) | No apparent conflict |
| `gitleaks/gitleaks` | `v8.30.1` | Local secret scanner CLI | [MIT](https://github.com/gitleaks/gitleaks/blob/v8.30.1/LICENSE) | No apparent conflict |
| `astral-sh/ruff-pre-commit` | `v0.17.1` | Python lint / format hook; Ruff implementation | [MIT](https://github.com/astral-sh/ruff/blob/0.17.1/LICENSE) | No apparent conflict |
| `hadolint/hadolint` | `v2.15.1` | Dockerfile linter | [GPL-3.0 (upstream Cabal identifier: GPL-3)](https://github.com/hadolint/hadolint/blob/v2.15.1/LICENSE) | No apparent conflict |
| `rhysd/actionlint` | `v1.7.12` | Workflow linter | [MIT](https://github.com/rhysd/actionlint/blob/v1.7.12/LICENSE.txt) | No apparent conflict |
| `zizmorcore/zizmor-pre-commit` | `v1.31.1` | Workflow security linter; zizmor implementation | [MIT](https://github.com/zizmorcore/zizmor-pre-commit/blob/v1.31.1/LICENSE) | No apparent conflict |

Source: `.pre-commit-config.yaml`. Local Prettier, Angular ESLint, Spotless, and Checkstyle hooks reuse the dependencies already listed. GPL/LGPL development executables do not automatically apply their licenses to the application they inspect; redistribution or modification of those tools has separate obligations.

## GitHub Actions

| Action repository | Pinned commit | Workflow locations | License / evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `actions/checkout` | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `ci-pipeline-workflows.yml`, `codeql.yml`, `deployment-workflows.yml`, `health-check-workflows.yml`, `security-workflows.yml`, `zizmor-workflows.yml` | [MIT](https://raw.githubusercontent.com/actions/checkout/3d3c42e5aac5ba805825da76410c181273ba90b1/LICENSE) | No apparent conflict |
| `dorny/paths-filter` | `ceb8a2b8f2d89434be7ff52d3de7ec3738c5cc9d` | `ci-pipeline-workflows.yml` | [MIT](https://raw.githubusercontent.com/dorny/paths-filter/ceb8a2b8f2d89434be7ff52d3de7ec3738c5cc9d/LICENSE) | No apparent conflict |
| `gitleaks/gitleaks-action` | `e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e` | `ci-pipeline-workflows.yml` | [Custom Gitleaks-Action EULA](https://raw.githubusercontent.com/gitleaks/gitleaks-action/e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e/LICENSE.txt) | Review |
| `actions/setup-java` | `b843ebf9b913146b38da2eaa7aeddf76074ae1ad` | `ci-pipeline-workflows.yml`, `codeql.yml` | [MIT](https://raw.githubusercontent.com/actions/setup-java/b843ebf9b913146b38da2eaa7aeddf76074ae1ad/LICENSE) | No apparent conflict |
| `actions/setup-node` | `949feb2413d6458794dcd2491c4babbbce0c15c1` | `ci-pipeline-workflows.yml` | [MIT](https://raw.githubusercontent.com/actions/setup-node/949feb2413d6458794dcd2491c4babbbce0c15c1/LICENSE) | No apparent conflict |
| `actions/upload-artifact` | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | `ci-pipeline-workflows.yml` | [MIT](https://raw.githubusercontent.com/actions/upload-artifact/cf430e030ddbb5b0abf93d22962f4752f3646cd9/LICENSE) | No apparent conflict |
| `actions/download-artifact` | `9000827ccba6bdab643e8b6fd33ac0654aef8333` | `ci-pipeline-workflows.yml` | [MIT](https://raw.githubusercontent.com/actions/download-artifact/9000827ccba6bdab643e8b6fd33ac0654aef8333/LICENSE) | No apparent conflict |
| `aquasecurity/trivy-action` | `ed142fd0673e97e23eac54620cfb913e5ce36c25` | `ci-pipeline-workflows.yml`, `security-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/aquasecurity/trivy-action/ed142fd0673e97e23eac54620cfb913e5ce36c25/LICENSE) | No apparent conflict |
| `github/codeql-action` | `6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee` | `ci-pipeline-workflows.yml`, `codeql.yml`, `security-workflows.yml` | [MIT action; CodeQL CLI has separate terms](https://raw.githubusercontent.com/github/codeql-action/6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee/LICENSE) | Review |
| `dependabot/fetch-metadata` | `25dd0e34f4fe68f24cc83900b1fe3fe149efef98` | `dependabot-auto-merge.yml` | [MIT](https://raw.githubusercontent.com/dependabot/fetch-metadata/25dd0e34f4fe68f24cc83900b1fe3fe149efef98/LICENSE) | No apparent conflict |
| `docker/setup-buildx-action` | `f87e5991a6d7451dcb8d9637bfbc97413f497069` | `deployment-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/docker/setup-buildx-action/f87e5991a6d7451dcb8d9637bfbc97413f497069/LICENSE) | No apparent conflict |
| `docker/login-action` | `dbcb813823bdd20940b903addbd779551569679f` | `deployment-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/docker/login-action/dbcb813823bdd20940b903addbd779551569679f/LICENSE) | No apparent conflict |
| `docker/metadata-action` | `dc802804100637a589fabce1cb79ff13a1411302` | `deployment-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/docker/metadata-action/dc802804100637a589fabce1cb79ff13a1411302/LICENSE) | No apparent conflict |
| `docker/build-push-action` | `c3c9e263c25d99ce0380d002d59b67737d91b0dc` | `deployment-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/docker/build-push-action/c3c9e263c25d99ce0380d002d59b67737d91b0dc/LICENSE) | No apparent conflict |
| `docker/login-action` | `81c6f93d4bc991e510b342a00b419b3bb4efc5c6` | `health-check-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/docker/login-action/81c6f93d4bc991e510b342a00b419b3bb4efc5c6/LICENSE) | No apparent conflict |
| `docker/scout-action` | `a4119c5a8c5076236a54e4ce99531f7e4dd2ef84` | `health-check-workflows.yml` | [Docker Subscription Service Agreement](https://raw.githubusercontent.com/docker/scout-action/a4119c5a8c5076236a54e4ce99531f7e4dd2ef84/LICENSE) | Review |
| `ossf/scorecard-action` | `fa7117db83c52d787ae5a89f350999701505d78e` | `security-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/ossf/scorecard-action/fa7117db83c52d787ae5a89f350999701505d78e/LICENSE) | No apparent conflict |
| `zaproxy/action-baseline` | `de8ad967d3548d44ef623df22cf95c3b0baf8b25` | `security-workflows.yml` | [Apache-2.0](https://raw.githubusercontent.com/zaproxy/action-baseline/de8ad967d3548d44ef623df22cf95c3b0baf8b25/LICENSE) | No apparent conflict |
| `zizmorcore/zizmor-action` | `85b2b9fb8e3325e7a23d7d0a9d7ba5ae0f999e3e` | `zizmor-workflows.yml` | [MIT](https://raw.githubusercontent.com/zizmorcore/zizmor-action/85b2b9fb8e3325e7a23d7d0a9d7ba5ae0f999e3e/LICENSE) | No apparent conflict |

All workflow paths above are relative to `.github/workflows/`. The `init`, `analyze`, and `upload-sarif` paths share the pinned `github/codeql-action` repository license. Both configured `docker/login-action` commits are listed separately. The reusable deployment workflow is local project code, not another external action.

## Scanning tools, runtimes, and containers

| Component | Repository reference / usage | License evidence | Status |
| :--- | :--- | :--- | :--- |
| `Trivy` | scripts/app-security-audit.sh uses local CLI or digest-pinned aquasec/trivy; CI uses trivy-action | [Apache-2.0 upstream; exact image contents not inventoried](https://github.com/aquasecurity/trivy/blob/main/LICENSE) | Review |
| `Semgrep` | scripts/app-security-audit.sh uses local CLI or digest-pinned semgrep/semgrep; --config auto | [LGPL-2.1 engine upstream; rules and commercial components have separate terms](https://github.com/semgrep/semgrep/blob/develop/LICENSE) | Review |
| `ZAP` | scripts/app-security-audit.sh uses digest-pinned ghcr.io/zaproxy/zaproxy; CI action-baseline | [Apache-2.0 upstream; add-ons and image contents separately licensed](https://github.com/zaproxy/zaproxy/blob/main/LICENSE) | Review |
| `Node.js` | Node 24.x; CI 24.22.1; npm 12.2.1 is listed separately above | [MIT primary license with bundled third-party notices](https://github.com/nodejs/node/blob/v24.22.1/LICENSE) | No apparent conflict |
| `Python` | pyproject.toml requires >=3.14; scripts also call python3 | [PSF-2.0 and included third-party notices](https://docs.python.org/3.14/license.html) | No apparent conflict |
| `Go` | go.mod selects 1.27.1 | [BSD-3-Clause primary license and third-party notices](https://go.dev/LICENSE) | No apparent conflict |
| `Eclipse Temurin / OpenJDK` | backend/Dockerfile: digest-pinned 25-jdk-noble build and 25-jre-noble runtime | [GPL-2.0 WITH Classpath-exception-2.0 for OpenJDK; image includes separately licensed Ubuntu packages](https://openjdk.org/legal/gplv2+ce.html) | Review |
| `PostgreSQL / pgvector` | docker-compose.yml and CI: digest-pinned pgvector/pgvector:pg18 | [PostgreSQL license upstream; extension and full image need digest-level inventory](https://github.com/pgvector/pgvector/blob/master/LICENSE) | Review |
| `Adminer` | docker-compose.yml: digest-pinned adminer:6 | [Apache-2.0 OR GPL-2.0 upstream; exact image contents not verified](https://github.com/vrana/adminer/blob/master/LICENSE) | Review |
| `curl` | backend/Dockerfile apt installation and shell scripts; package version not pinned | [curl license; dependencies retain their licenses](https://curl.se/docs/copyright.html) | Review |
| `jq` | scripts/ci/scan-cloudflare.sh and scan-virustotal.sh; runner-provided | [MIT primary license; bundled dependencies separately licensed](https://github.com/jqlang/jq/blob/master/COPYING) | No apparent conflict |
| `Git / Bash / Docker tooling / GitHub CLI` | Runner and local prerequisites used by automation; versions not locked here | [Separate system-tool licenses and service terms; not included in package-level clearance](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) | Review |

Container digests and overridable scanner references are recorded in `backend/Dockerfile`, `docker-compose.yml`, `scripts/app-security-audit.sh`, and the workflows. A digest pins bytes; it does not provide a complete license list. Current upstream links above do not verify every component at those digests. Playwright also installs Chromium headless shell with system dependencies in CI; browser binaries carry their own BSD-style and third-party notices, separate from the Apache-2.0 test runner. See [Chromium licensing](https://github.com/chromium/chromium/blob/main/LICENSE).

## Project-local agent skills

| Skill | Local evidence | License / upstream evidence | Status |
| :--- | :--- | :--- | :--- |
| `dotagents` | agents.toml / agents.lock; getsentry/dotagents commit 0899a97d8bff86644331f14c2053236a78d891ca | [MIT at locked source commit](https://github.com/getsentry/dotagents/blob/0899a97d8bff86644331f14c2053236a78d891ca/LICENSE.md) | No apparent conflict |
| `security-audit` | skills-lock.json; cloudflare/security-audit-skill; content hash but no upstream commit | [MIT current upstream; installed snapshot not verified](https://github.com/cloudflare/security-audit-skill/blob/main/LICENSE) | Review |
| `sentry-cli` | Installed SKILL.md version 0.47.0; agents.lock records https://cli.sentry.dev without immutable revision | [Installed skill license unverified; current getsentry/toolkit upstream is FSL-1.1-Apache-2.0](https://github.com/getsentry/toolkit/blob/main/LICENSE.md) | Review |
| `web-design-guidelines` | Installed .agents/skills/web-design-guidelines/SKILL.md metadata version 1.0.0; absent from both skill locks | [License for installed snapshot unverified; matching upstream skill exists](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md) | Review |

A skill’s instructions, the CLI it invokes, and the runtime used to install it can have different licenses. The downloaded `sentry` agent CLI/skill is not the `@sentry/cli` source-map uploader. Agent skills are development resources, not automatically part of the deployed website.

## Bundled font

| Asset | Location | License / evidence | Status |
| :--- | :--- | :--- | :--- |
| Inter Variable font | `frontend/V.T.Thanh-Home-Angular/public/fonts/InterVariable.woff2` | OFL-1.1; bundled `Inter-LICENSE.txt` | No apparent conflict |

## Review decisions and distribution obligations

- **BotID 1.5.11:** the frontend lockfile does not declare a license. Do not restore the former MIT classification without evidence covering the distributed package and vendor terms. See [version-specific npm metadata](https://registry.npmjs.org/botid/1.5.11).
- **Sentry source-map CLI 3.8.2:** [the versioned license](https://github.com/getsentry/sentry-cli/blob/3.8.2/LICENSE) is FSL-1.1-MIT. Its permitted-purpose limits apply before the future MIT grant; a future grant does not mean the current version is already MIT. Review intended use and any redistribution.
- **Gitleaks Action:** [the pinned EULA](https://github.com/gitleaks/gitleaks-action/blob/e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e/LICENSE.txt) distinguishes organization-owned repositories, which require a key, from personal-account repositories. It restricts modification and redistribution. Do not apply the MIT license of the separate Gitleaks CLI to this action.
- **Docker Scout:** [the pinned action license](https://github.com/docker/scout-action/blob/a4119c5a8c5076236a54e4ce99531f7e4dd2ef84/LICENSE) points to the Docker Subscription Service Agreement. Confirm the account entitlement and intended usage; Apache-2.0 licenses on other Docker actions do not cover Scout.
- **CodeQL:** [the pinned README](https://github.com/github/codeql-action/blob/6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee/README.md) separates the MIT action from the underlying CLI’s GitHub terms. Confirm eligibility for the repository and scanning configuration.
- **Semgrep:** `--config auto` obtains rules separately from the engine. Review the selected rules and any proprietary capabilities; the engine’s LGPL declaration does not license all rules.
- **Attribution and copyleft:** preserve required copyright/license texts and applicable NOTICE files for shipped JavaScript, workers, fonts, JAR dependencies, and containers. Retain the bundled Inter OFL text. EPL/GPL/LGPL obligations depend on what is modified and distributed; a development-tool license does not automatically relicense inspected application code.
- **Unpinned evidence:** resolve the installed skill snapshots, Python build backend version, scanner image contents, and system-package versions before claiming a complete redistribution clearance. Hosted services such as Vercel/BotID, Sentry, Cloudflare, Groq, Google APIs, VirusTotal, Render, Docker Hub, and GitHub also have service terms outside this source-package matrix.

## Maintenance and verification

Regenerate or review this inventory whenever manifests, lockfiles, workflow action refs, pre-commit revisions, scanner images, or vendored assets change. Recheck it before publishing a release or redistributing build images/tools. Use the committed locks for resolved versions and version-specific publisher metadata for license evidence. A full release audit should enumerate the omitted transitive dependencies and image packages and verify the notices actually shipped.

This update was checked against all direct frontend entries, npm overrides, CI bootstrap npm, backend direct dependencies and build constraints, Python/Go manifests, configured hook repositories, and unique external workflow repository/ref pairs. Codegraph was queried before editing; configuration and lockfiles were inspected directly because the graph does not provide a dependency-license inventory. Context7 returned current Sentry documentation distinguishing the two CLIs, but no matching version-specific license coverage; the versioned published license files take precedence. No dependency installations, builds, application changes, or lockfile regeneration were required.
