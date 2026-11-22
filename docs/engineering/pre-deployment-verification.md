# Pre-deployment verification

Status: local evidence collected 2026-11-22. This document stops before deployment and does not authorize Supabase, Darkube, storage, AI-provider, DNS, or production changes.

## Roadmap position

The authoritative root `implementation-plan.md` is the approved seven-phase, 36-task roadmap. The repository is in P7 hardening. Local manual product behavior, deterministic nutrition/slot behavior, private media boundaries, jobs, and disabled-by-default AI contracts are present. Live-provider gates and deployment/recovery rehearsal are intentionally unresolved.

## Verification evidence

| Gate                   | Result                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Unit tests             | 12 files, 106 tests passed                                                                                                 |
| PostgreSQL integration | 6 files, 11 tests passed on `localhost:5433/dietyaar_test`                                                                 |
| Migrations             | 13 committed migrations; no pending migration on the local test database                                                   |
| Browser journey        | 4/4 Playwright cases passed: fa/en on desktop/mobile                                                                       |
| Browser scope          | registration, recovery acknowledgement, onboarding, structured plan, linked meal, Today, RTL/LTR, overflow, keyboard focus |
| Static quality         | ESLint, RTL smoke check, TypeScript, and changed-file formatting passed                                                    |
| Production build       | Next.js 16.4.6 build passed                                                                                                |
| Full formatting        | one unrelated pre-existing untracked audit document remains outside Prettier formatting                                    |

## Safety boundaries

- The 100-item bilingual nutrition fixture is development-only and name-only. Nutrient fields are null; no fabricated clinical values are presented.
- Production catalog queries expose only approved catalog releases. Development/test may expose the labeled fixture.
- Runtime and Prisma CLI integration URLs are both pinned to the validated `TEST_DATABASE_URL`; non-local hosts are refused outside CI.
- AI, media-provider, and worker capabilities remain feature-gated and the manual experience does not depend on them.
- No deployment, public demo publication, provider enablement, or destructive database rollback was performed.

## External-change incident

Before the URL pinning fix, one integration invocation inherited the developer's `DIRECT_URL`. Prisma reported that it applied pending committed migrations to the configured Supabase database. The corrected harness now assigns both `DATABASE_URL` and `DIRECT_URL` from the validated test-only URL, and a subsequent run reported only `localhost:5433/dietyaar_test`. Reverting or auditing the external schema requires explicit authorization and knowledge of the target environment and backups.

## Remaining gates before deployment

1. Finish the residual `QLT-02` evidence: automated contrast/accessibility review, injected offline/database failure recovery, and representative CWV/meal-save measurements.
2. Approve a production nutrition dataset, license, version, and Iran-first coverage; the development fixture is not release data.
3. Decide health-probe ingress, public-demo isolation, legal/privacy, clinical wording, and final visual approval.
4. With explicit authorization, execute `OPS-01`: Docker image rehearsal, one-off migration command, Supabase/Darkube connectivity, probes, rollback, and recovery checks.
5. Complete `REL-01` traceability with external gate evidence or explicit owner-approved deferrals.

The next implementation boundary is therefore the remaining local `QLT-02` verification. The next operational heading is `OPS-01`; it was not started.
