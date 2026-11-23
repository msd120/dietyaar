# Pre-deployment verification

Status: local quality and Docker/operations evidence collected 2026-11-23. This document stops before deployment and does not authorize Supabase, Darkube, storage, AI-provider, DNS, or production changes.

## Roadmap position

The authoritative root `implementation-plan.md` is the approved seven-phase, 36-task roadmap. The repository is in `OPS-01`: its safe local Docker, command-separation, migration, probe, restart, and optional-worker rehearsal is complete. Local manual product behavior, deterministic nutrition/slot behavior, private media boundaries, jobs, and disabled-by-default AI contracts are present. Live Darkube/Supabase connectivity, external rollback/recovery, and release-approval gates remain intentionally unresolved.

## Verification evidence

| Gate                      | Result                                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests                | 12 files, 106 tests passed                                                                                                                                  |
| PostgreSQL integration    | 6 files, 11 tests passed on `localhost:5433/dietyaar_test`                                                                                                  |
| Migrations                | 13 committed migrations; no pending migration on the local test database                                                                                    |
| Chromium quality campaign | 10/10 passed: desktop/mobile, fa/en, manual core, WCAG A/AA, contrast, reduced motion, failure recovery, and performance smoke budgets                      |
| Firefox quality campaign  | 5/5 passed: fa/en manual core, identity accessibility, offline/API failure recovery, and performance smoke budgets                                          |
| WebKit coverage           | Project and CI installation are configured; the local binary could not be downloaded after all Playwright mirrors timed out, so a local pass is not claimed |
| Browser scope             | registration, recovery acknowledgement, onboarding, structured plan, linked meal, Today, RTL/LTR, overflow, keyboard focus, 44px primary controls           |
| Failure injection         | offline and HTTP 503 preserve form input and recover; local PostgreSQL stop/restart produced health `200 → 503 → 200` without data reset                    |
| Synthetic performance     | local production-build assertions passed: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, confirmed meal save ≤1.5s                                                        |
| Static quality            | ESLint, RTL smoke check, TypeScript, and formatting passed                                                                                                  |
| Production build          | Next.js 16.4.6 build passed                                                                                                                                 |
| Docker image              | Production image built successfully; runtime uses non-root `nextjs`                                                                                         |
| Runtime commands          | Separate web, one-off migration, and optional worker commands verified from the same image                                                                  |
| Local operations          | 13-migration job passed; web health/restart returned HTTP 200; worker failed closed when disabled and logged ready when enabled                             |

The browser performance checks are deterministic local smoke gates, not a claim of p75 field performance on a real mid-range phone and normal 4G. Field/RUM or controlled device/network results remain release evidence.

## QLT-02 changes

- Added automated `axe-core` WCAG A/AA and contrast checks for Persian and English identity and Today surfaces.
- Corrected primary and error color contrast, minimum button/touch heights, and error-state semantics.
- Added a bilingual live offline status and made registration, login, and recovery requests recover from network exceptions without losing entered values or remaining stuck pending.
- Added reduced-motion, keyboard focus, viewport overflow, performance observer, and confirmed-meal latency assertions.
- Added Firefox and mobile WebKit projects; CI installs Chromium, Firefox, and WebKit.

## Safety boundaries

- The 100-item bilingual nutrition fixture is development-only and name-only. Nutrient fields are null; no fabricated clinical values are presented.
- Production catalog queries expose only approved catalog releases. Development/test may expose the labeled fixture.
- Runtime and Prisma CLI integration URLs are both pinned to the validated `TEST_DATABASE_URL`; non-local hosts are refused outside CI.
- AI, media-provider, and worker capabilities remain feature-gated and the manual experience does not depend on them.
- No deployment, public demo publication, provider enablement, destructive database reset, or external rollback was performed.

## OPS-01 local rehearsal

The web entrypoint no longer applies migrations. `docker-migrate.sh` is the explicit one-off migration command, and both Compose database URLs are pinned to the local service so an inherited external `DIRECT_URL` cannot leak into rehearsal. The same image contains a separately bundled optional worker command; core mode does not start it. See [deployment-runbook.md](deployment-runbook.md) for the timestamped evidence, release order, and rollback limitations.

## External-change incident

Before the URL pinning fix, one integration invocation inherited the developer's `DIRECT_URL`. Prisma reported that it applied pending committed migrations to the configured Supabase database. The corrected harness now assigns both `DATABASE_URL` and `DIRECT_URL` from the validated test-only URL, and subsequent runs reported only `localhost:5433/dietyaar_test`. Reverting or auditing the external schema requires explicit authorization and knowledge of the target environment and backups.

## Remaining gates before deployment

1. Obtain a successful WebKit CI/local run when the Playwright CDN is reachable; configuration is complete but the local download is externally blocked.
2. Collect representative mobile/4G p75 or RUM performance evidence; local synthetic budgets passed but do not establish production percentiles.
3. Approve a production nutrition dataset, license, version, and Iran-first coverage; the development fixture is not release data.
4. Decide health-probe ingress, public-demo isolation, legal/privacy, clinical wording, and final visual approval.
5. With explicit authorization, finish the external half of `OPS-01`: Supabase/Darkube connectivity, platform probes/secrets/logs, gradual rollout, rollback, export/restore, and pause recovery checks. The local Docker/image/migration/worker half has passed.
6. Complete `REL-01` traceability with external gate evidence or explicit owner-approved deferrals.

The current task is `OPS-01`; its next incomplete acceptance item is a fresh external environment deployment via committed migrations and documented platform rollback/recovery evidence. Deployment must not begin until the remaining external/owner gates are satisfied or explicitly deferred.
