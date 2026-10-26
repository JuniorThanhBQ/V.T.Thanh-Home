# Backend architecture reviewed — 26 October 2026

## What

The backend is a portfolio REST application built with Spring Boot 4.1.1, Java 25 and Gradle 9.8.1. It uses Spring MVC, Security, Data JPA, Actuator, Flyway and PostgreSQL. The build declares application version 1.0.2.

Scope includes backend Java, test source, resources, migrations, build files, Docker packaging, documentation and the two root Compose files. Generated output, caches, secret/env contents, archives, root CI, providers and live deployments are excluded. The 111 authored files include 88 Java files. The wrapper JAR and generated bin copies were inventoried, not analyzed or executed.

The inspection began at commit `43df4e21835809be9dd9698a91aff036f6403f12` on 25 October. It resumed at `697145093e857cbc2fe5bb0a4fe3db50fa566353` on 26 October with a clean working tree. Backend/Compose Git comparison and saved source hashes showed no intervening changes.

## Why

The material principals and resources are:

- Anonymous callers can fetch public configuration/content/health and register visitor metadata.
- Registered visitors obtain identity from a server-held servlet session, submit contacts and use their own conversation.
- Administrators authenticate against active stored accounts and manage content, contacts, visitor blocking and non-public operational endpoints.
- Operators configure credentials, remote portfolio knowledge, origins, challenge policy, profiles and deployment.
- Scheduled contact delivery acts with the operator's email credentials and fixed recipient.

Spring Security configures explicit public exceptions, ADMIN rules and a deny-all fallback. CSRF uses a cookie repository and request handler; CORS uses configured origins. Login changes existing session IDs before storing ADMIN context; logout invalidates the session. Visitor checks reload the server-selected record and blocking status. Conversation lookup verifies visitor ownership.

The comparable baseline is a server-session REST application with public readers and a global administrator. No separate comparable product was used to dismiss or elevate findings.

## How

Controllers map request DTOs into services and parameter-bound repository operations. Public blog queries filter PUBLISHED and project queries filter published=true. Admin writes are separate; optional submitted-version comparisons complement entity versioning.

Contact submission validates fields, applies rate/challenge checks and scopes idempotency to the server visitor. A scheduled worker transactionally claims bounded pending batches and makes bounded delivery attempts. Gmail OAuth/send destinations and the notification recipient are not browser-selected; subject and plain-text body are encoded.

Chat uses server session state for conversation selection. It records request/history state in transactions, performs provider work outside those transactions and persists completion/failure. Controls include message/request-ID bounds, per-visitor in-flight exclusion, two process-wide slots, network/visitor request windows and a synchronized process-local UTC daily budget. Groq requests have a fixed destination, bounded context/output and at most two key attempts.

Knowledge text comes from operator configuration through HTTPS, with bounded body/cache size, then enters the model prompt. No browser-controlled URL selector or model tool-execution path was found. The frontend remains responsible for rendering returned Markdown.

Turnstile checks provider success, action and hostname when enabled; missing enabled-mode keys fail closed. Production YAML defaults it on, while production Compose explicitly defaults it off. Backend README line 71 already documents that launch-policy difference. It is a configuration choice to inspect, not a demonstrated live bypass.

Docker selects main source, explicit build inputs and a non-root runtime. Development and production Compose differ in profiles, cookie security and exposed services. Request-size, header/logging and exception-handling source was reviewed separately.

Starting paths are `backend/V.T.Thanh-Home-SpringBoot/src/main/java`, `src/main/resources`, `src/test`, build/Gradle files, `backend/Dockerfile`, `backend/Dockerfile.dockerignore`, `backend/README.md` and root Compose files. Companion selection follows HTTP/session, owner/data isolation, resource limits, AI/context, deployment and build-input boundaries.

## When

The prior frontend run had no vulnerability records and marked backend scope excluded. That exclusion became current backend work; frontend source checks did not suppress backend review. A dated frontend addendum now distinguishes source controls inspected here from runtime facts still unknown.

Tests were read, not run. Some integration setup deletes database rows and accepts database overrides. No application, build, provider, browser, dependency installation or live probe was executed. A complete execution sandbox and safe runtime-artifact promotion were not established.

Current advisories, dependency integrity, emitted/deployed artifacts, active settings, proxy identities, effective cookies/headers, database state and concurrency/provider behavior remain outside observed evidence. Both source coverage critics accepted no missing units. The exact skill workflow remains incomplete because prescribed CLI input safety is unavailable on Windows; exported structural checks are additional evidence only.
