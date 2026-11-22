# Dietyaar comprehensive audit

**Audit date:** 2026-11-21  
**Scope:** repository working tree, checked-in specifications, current uncommitted implementation, and safe local validation only. No source, dependency, schema, configuration, or deployment changes were made.  
**Authority:** `docs/engineering/technical-spec.md` §1.1–1.2 takes precedence over the product and design documents. The visual-design document is explicitly alpha; it is not treated as final approval.

## A. Executive summary

Dietyaar has a credible engineering foundation and a visually promising, authenticated **demo** in the working tree. It is not, however, a working Dietyaar MVP. The implemented application has an identity shell, a health endpoint, localization primitives, local UI primitives, and static demo representations of product screens. It does not yet implement the manual plan → meal → confirmation → deterministic adherence/Today loop that the product identifies as its core value.

The repository itself describes the phase accurately: `README.md` says “foundation stage” and `implementation-plan.md` says the product is not feature-complete. The current uncommitted Better Auth/demo work moves the shell forward, but does not change that conclusion. A public release is blocked by missing functional domains, lifecycle/security controls, product-journey tests, release evidence, and an unexecuted build/test suite.

**Finding counts:** 2 Critical, 5 High, 6 Medium, 2 Low (15 total). One additional validation limitation is recorded as unverified rather than a product defect.

Strengths include strict TypeScript, an App Router baseline, request-scoped `next-intl`, RTL-oriented local primitives, Prisma migrations, environment validation for optional providers, baseline security headers, Docker/CI scaffolding, and an explicit manual-first architecture. The central risk is not code complexity; it is a gap between a polished navigable demo and absent persistent product behavior.

## B. Project and implementation status

### Observed development phase

Foundation/P1, with an in-progress identity and static design/demo spike. This is supported by `README.md`, the seven-phase `implementation-plan.md`, and the route inventory. The committed baseline is foundation-only; the working tree adds Better Auth tables/routes and `/[locale]/demo/[screen]`.

### Implemented, partial, and absent capabilities

| Capability                                                   | Status                                  | Evidence                                                                |
| ------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| Persian/English route shell and document direction           | Implemented foundation                  | `src/i18n/*`, `[locale]/layout.tsx`, `html[dir]` selection              |
| Local UI primitive surface / basic RTL safeguards            | Implemented foundation                  | `src/components/ui/*`, `UiComponents.tsx`, `lint:rtl`                   |
| Environment gates, health probe, headers, Docker/CI scaffold | Implemented foundation                  | `env-schema.ts`, `api/health`, `security-headers.ts`, Docker/CI files   |
| Better Auth handler/session demo                             | Partial, uncommitted                    | `api/auth/[...all]`, `lib/auth.ts`, `schema.prisma`, demo login         |
| Registration, recovery, production account journey           | Missing                                 | Better Auth uses `disableSignUp: true`; no recovery UI/route/service    |
| Onboarding, consent, profile persistence                     | Missing                                 | no product models, actions, or services                                 |
| Plans, foods, meal drafts/confirmation, totals, adherence    | Missing                                 | no domain/service/action modules; Prisma has only identity models       |
| Today/history/weight/reflections/settings/export/deletion    | Missing functional implementation       | static demo components only; no corresponding persistence or operations |
| Media, storage, worker, AI                                   | Not implemented and disabled by default | no provider/storage/worker modules; flags false in `.env.example`       |

The demo contains labels corresponding to A01–A02, O01–O09, T01, M01–M05, H01–H04, P01–P04, S01–S07, and L01. Those pages are a navigable presentation catalogue, not evidence that their required states or operations work.

## C. Product–specification compliance matrix

| Approved requirement (governing source)                                                                      | Status                               | Evidence / gap                                                                      |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------- |
| Manual experience works without AI/storage credentials (technical §2, product §3)                            | Foundation support only              | env gates permit core boot; manual plan/meal flow absent                            |
| Public account lifecycle with chosen technical auth model (technical §§1.2, 7)                               | Partial                              | Better Auth route exists; sign-up disabled and no recovery lifecycle                |
| Resumable adult onboarding and optional profile fields (technical §§9, 11; product §6)                       | Not started                          | no models or feature routes                                                         |
| Manual plan versions and activation (technical §§9–11)                                                       | Not started                          | no plan schema/service/actions                                                      |
| Confirmed meals, unknown nutrients preserved, deterministic totals/alignment (technical §10; product §§8–10) | Not started                          | no meal/nutrition/day schema or calculation code                                    |
| Today/history and incomplete-data clarity (product §§10–11)                                                  | Not started                          | T01 is static sample content                                                        |
| RTL/LTR runtime locales (technical §13)                                                                      | Partial                              | locale routes/direction work at shell level; product copy is not dictionary-managed |
| Accessible responsive critical journeys (technical §14, §23)                                                 | Partial foundation                   | primitive base exists; journeys/states and executable acceptance tests absent       |
| Owner-scoped authorization/adversarial isolation (technical §8, §23)                                         | Not started                          | no owned product data or cross-account tests                                        |
| Export/deletion/privacy/retention (technical §19)                                                            | Not started                          | only demo labels                                                                    |
| Optional media/AI, draft-only and consent gated (technical §§15–17)                                          | Correctly disabled but unimplemented | flags/config validation exist; no implementation                                    |

## D. User-journey evaluation

### Registration/login and recovery

The current landing page is a prefilled demo sign-in. It can show an inline failed-credential alert, has labels/autocomplete attributes, and provides a password visibility control with an accessible name. That is a good small-form baseline. It is not a consumer registration, email-code, or recovery journey. The technical specification overrides product email OTP with username/password plus a user-held recovery code; neither a user-facing registration nor recovery journey is present.

### Onboarding, plans, meals, adherence, history, settings

All appear as static screens selected from a demo sidebar. The screen data is a list of titles/descriptions; `DemoShell` renders sample cards and generic views. No route accepts plan/meal input, no data is saved, and no plan, meal, adherence, or history calculation is present. Therefore interaction counts, completion time, error recovery, duplicate protection, and actual mobile task success cannot be measured. Claiming that meal logging is fast would be unsupported.

### UX conclusion

The information architecture is understandable in the demo: Today, meals, history, plan, and settings are grouped sensibly, and the persistent “sample data” label helps signal non-production content. But the number of links should not be mistaken for discoverability or a validated journey. Critical required states—empty, offline, loading, failed save, incomplete nutrients, no active plan, confirmation/reopen, and undo—have not been demonstrated functionally.

## E. Meal logging and adherence experience

No real meal-log task exists. The M01–M05 routes render demo views and there are no meal tables, form actions, server actions, services, or deterministic calculation functions. Accordingly:

- No actual manual meal can be created, reviewed, confirmed, edited, deleted, saved, or reused.
- No interaction count or task duration was measured.
- There is no evidence that drafts are excluded from totals, that unknown nutrients remain `null`, or that duplicates/stale submissions are handled.
- The static T01 sample cannot establish whether adherence avoids misleading conclusions when data is partial.

The product’s core loop is therefore unvalidated and unavailable, not merely incomplete in edge cases.

## F. UI and visual design assessment

The demo is coherent: cards, green accent treatment, typography scale, rounded controls, information grouping, and compact mobile sidebar treatment generally align with the alpha visual direction’s calm, health-oriented intent. The `lg:ms-80` shell, `start`/`end` positioning, and locale-specific directional arrows show attention to bidirectional layout. The demo also uses visible labels for form controls and an alert role for login failure.

Limitations are material:

- The checked-in visual direction is alpha, so professional polish cannot be assessed as approval compliance.
- The demo has no proven loading, validation, success, empty, error, destructive, or partial-data states for the actual product flows.
- The demo’s screen catalogue is dense navigation for a presentation, not evidence that a consumer mobile navigation has been usability-tested.
- No browser visual, contrast, responsive, or screen-reader test could execute in this environment. The static mobile E2E file exists but requires an available database, seeded demo account, and browser execution.

## G. Persian/English and accessibility assessment

### Localization and bidirectionality

Shell-level locale routing is present (`/fa`, `/en`) and the layout changes `lang`/`dir`. The demo gives Persian and English labels and uses logical positioning utilities in key places. The static inspection did not identify a product-data conversion path that could alter user-entered Persian text because no user-owned product text is stored yet.

However, user-facing demo strings are embedded directly in `DemoLogin.tsx`, `DemoShell.tsx`, and `demo-screens.ts`, rather than in both runtime message dictionaries. `src/messages/fa.ts` and `en.ts` contain only the old foundation keys. There is no parity mechanism for these demo strings, no completed locale switch persistence, and no end-to-end proof of Jalali/Gregorian behavior on a product journey.

### Accessibility

Verified positives: the login inputs have labels, the password toggle and mobile-menu controls have `aria-label`s, and the failed login has `role="alert"`. The base UI kit provides a useful foundation.

Potential concerns requiring manual/browser testing: focus trapping/return for the mobile drawer, keyboard navigation across its overlay and navigation links, focus visibility, contrast in every theme/state, touch-target dimensions, and reduced-motion behavior. No WCAG 2.2 AA conformance claim is justified. Product form error announcements and focus management are not available because the product forms do not exist.

## H. Functional QA results

| Check                         | Result                                     | Evidence                                                                                                       |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `npm run lint:all`            | **Passed**                                 | ESLint, RTL smoke check, TypeScript, and Prettier completed on 2026-11-21                                      |
| `npm test`                    | **Blocked/unverified**                     | Vitest could not spawn any fork worker: `spawn EPERM`; no tests executed                                       |
| `npm run build`               | **Partially executed / failed validation** | Turbopack compilation succeeded; Next’s TypeScript worker failed with `spawn EPERM`, so build did not complete |
| Database integration          | **Not run**                                | requires isolated PostgreSQL; no destructive database action was taken                                         |
| E2E / mobile checks           | **Not run**                                | needs running DB, seeded account and Playwright browser                                                        |
| Product functional acceptance | **Not executable**                         | required product functionality is absent                                                                       |

The `npm test` and build worker failures are environment restrictions in this sandbox, not evidence that application assertions fail. They must be rerun on CI or an unrestricted workstation. The current quality commands nevertheless reveal a separate static CI issue in finding F-008 below.

## I. Security and privacy assessment

Foundation posture is directionally sound: privileged environment values are server-side, optional AI/media flags are default-off, the environment schema requires credentials when those features are enabled, `api/health` is dynamic/no-store, and baseline CSP/frame/referrer/content-type headers exist. No secrets were accessed or reported.

The required protection for Dietyaar data cannot yet be evaluated: there are no user-owned product records, owner-scoped queries, services, export/download operations, signed media URLs, retention jobs, consent records, or cross-account adversarial tests. Better Auth session behavior also remains unverified locally. A route-level session check around the demo is not a substitute for service-level authorization predicates required by technical §8.

The demo seed script contains a fixed demo username and password. That is acceptable only as isolated development/demo tooling with explicit deployment safeguards; if it is run in a public environment without isolation, it creates a known account credential. This is an architectural security risk rather than a verified exposed production vulnerability.

## J. Architecture and code quality assessment

The intended architecture is strong and the project enforces several boundaries with ESLint. It uses the approved App Router/Prisma/Better Auth direction rather than the superseded custom-cookie system. The `src/services`, `src/actions`, `src/domain`, and `src/providers` folders are absent, however, so the important boundary—owner-scoped service writes and pure deterministic domain logic—has not yet been exercised by product code.

Identity code is placed in `src/lib/auth.ts`, a direct Better Auth route handler is provided, and the schema contains the corresponding identity models. That is reasonable as an early identity spike. Current demo UI imports UI components directly from `components/ui/*`, which the project allows, but bypasses the preferred barrel surface declared in `AGENTS.md`; this is minor compared with missing product behavior.

There is also a legacy locale module/message path alongside `next-intl` (`lib/locale.ts`, `lib/t.ts`, `messages/index.ts`, `legacy-*`). The implementation plan itself identifies this as temporary migration debt. It needs resolution before feature work proliferates two conflicting localization approaches.

## K. Performance and deployment assessment

No runtime Web Vitals, server latency, query plans, load results, image measurements, or database timings were collected. No claim against the technical targets (p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1, confirmed-meal p95 ≤1.5 s) is possible.

Operational scaffolding exists: standalone Docker output, health check, Docker entrypoint migration deployment, CI jobs, Renovate configuration, structured logging, and isolated test database conventions. Deployment readiness is not established. The image build was not run, CI has not been observed, external Supabase/Darkube verification has not occurred, and backup/restore, logging/alerting, migration rehearsal, and rollout evidence are absent.

## L. Prioritized findings register

For every finding below, the expected behavior is the requirement named in its final column (for example, a manual confirmed-meal flow for F-001/F-005, service-level owner scoping for F-006, and centralized bilingual copy for F-009). The evidence column states the observed behavior and, where safe and meaningful, the reproduction method. The impact/recommendation column supplies the user/business consequence and corrective direction. This compact form avoids inventing execution results for features that do not exist.

| ID    | Category / classification               | Severity | Affected journey                | Evidence and reproduction                                                                                                                                                                                                                                   | Impact / recommended improvement                                                                                                                                                        | Spec reference                           |
| ----- | --------------------------------------- | -------: | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| F-001 | Missing implementation                  | Critical | Core J01, J03, J05–J11          | Route inventory has only locale shell, demo, auth, health. No `services`, `actions`, `domain`, plan/meal/day models, or calculation code. Navigate to demo screens: values are samples only.                                                                | Product cannot perform its primary job. Deliver P2/P3 manual vertical slice before optional features.                                                                                   | Product §§3, 8–11; technical §§9–12, 26  |
| F-002 | Missing implementation                  | Critical | Privacy/lifecycle, J17–J18      | Prisma schema has identity models only; no export/deletion/consent/retention implementation.                                                                                                                                                                | Cannot meet privacy obligations or release gates. Implement owner-scoped lifecycle flows and evidence before public release.                                                            | Technical §19; product §18               |
| F-003 | Missing implementation                  |     High | A01/A02, recovery               | `lib/auth.ts` has `emailAndPassword.disableSignUp: true`; no recovery UI/service; root route is demo sign-in.                                                                                                                                               | No supported new-user or recovery path. Implement the technical-spec auth journey, then test it.                                                                                        | Technical §§1.2, 7; design A01–A02       |
| F-004 | Specification mismatch / UX opportunity |     High | All product journeys            | `DemoShell` advertises product pages but actions persist only sign-out; `demo-screens.ts` is static metadata.                                                                                                                                               | Stakeholders can infer feature completeness incorrectly. Keep demo explicitly segregated and do not use it as acceptance evidence; build working flows.                                 | Product §§4, 17; design §2               |
| F-005 | Missing implementation                  |     High | J05–J10, T01/H01                | No nutrition catalog, meal/draft schema, confirmation operation, totals, completeness, alignment, or history.                                                                                                                                               | No way to validate fast logging, unknown data, adherence, or sustainable use. Implement deterministic core before AI.                                                                   | Product §§8–10; technical §§9–10         |
| F-006 | Architectural risk                      |     High | All private product data        | No owned domain services/data yet and no adversarial two-account tests. Demo route session checks do not prove query predicates.                                                                                                                            | Future IDOR/cross-account risk is untested. Establish service-only owner predicates and test every owned operation as the first domain models arrive.                                   | Technical §8, §23; AGENTS security rules |
| F-007 | Architectural security risk             |     High | Demo authentication             | `scripts/seed-demo-user.ts` uses a fixed username/password; `DemoLogin.tsx` pre-populates it. Exposure was not tested.                                                                                                                                      | If seeded in a reachable environment, known credentials permit access to that demo account. Ensure demo tooling cannot run in public/release environments and never contains real data. | Technical §7, §19                        |
| F-008 | Verified defect                         |   Medium | CI database validation          | New `20261121090000_better_auth` migration is present, but `database-foundation.integration.ts` asserts the migrations table equals only `20261118000000_foundation`. A fresh integration run with both migrations will fail this exact equality assertion. | CI database integration becomes inconsistent with current migration state. Update the test expectation as part of the identity change.                                                  | Technical §§23–25; migration procedure   |
| F-009 | Specification mismatch                  |   Medium | Persian/English all journeys    | User-facing demo strings are hard-coded across three feature files; current `fa.ts`/`en.ts` only define `foundation` strings.                                                                                                                               | Key parity and centralized translation review cannot protect the current UI. Move product copy into both runtime dictionaries when feature work proceeds.                               | AGENTS localization rules; technical §13 |
| F-010 | Missing implementation                  |   Medium | J02, J12–J18                    | No onboarding/profile/weight/settings/export/delete data models or actions.                                                                                                                                                                                 | Required supporting jobs and privacy controls are unavailable. Implement after manual core in the approved sequence.                                                                    | Product §§6, 12, 16–18; technical §26    |
| F-011 | Missing implementation                  |   Medium | J19/J20                         | Storage, worker, provider adapters, validation, job state and AI consent records are absent; flags remain off.                                                                                                                                              | No evidence for required image flow or safe AI fallback. Keep disabled until manual core and provider gates pass.                                                                       | Product §§7, 15; technical §§15–17       |
| F-012 | Unverified concern                      |   Medium | Build and regression confidence | `npm test` and final `next build` validation both fail to create workers (`spawn EPERM`) in this sandbox; E2E/integration were not run.                                                                                                                     | The current worktree lacks executable verification evidence here. Rerun on CI/unrestricted environment before merge/release.                                                            | Technical §23; AGENTS delivery           |
| F-013 | UX/UI improvement opportunity           |   Medium | Mobile nav and visual states    | Static inspection finds named menu controls and logical utilities; no browser-based keyboard, focus, contrast, or state testing ran.                                                                                                                        | Accessibility and mobile quality remain unproven. Add journey-level WCAG/Playwright evidence once flows are real.                                                                       | Design §3; technical §§13–14, 23         |
| F-014 | Architectural risk                      |      Low | Localization maintenance        | `next-intl` runtime dictionaries coexist with legacy build-time `lib/t.ts`/`lib/locale.ts` and legacy message files.                                                                                                                                        | New features may split copy/localization paths. Retire or clearly fence the legacy path before broad product implementation.                                                            | ADR-008; technical §13                   |
| F-015 | Security hardening opportunity          |      Low | Operations                      | Public `/api/health` exposes a database health boolean. This is common for orchestration and no sensitive data is returned.                                                                                                                                 | Low information disclosure; decide whether ingress/probe policy should restrict it in production.                                                                                       | Technical §§19, 21, 24                   |

### Finding evidence detail

**F-008 reproduction:** Start an isolated PostgreSQL instance; run the normal migration deployment with the current migration directory; execute `npm run test:integration`. The test queries all non-rolled-back `_prisma_migrations` rows then uses `toEqual` against a single expected foundation row, whereas the repository now contains the second Better Auth migration. This is a deterministic static incompatibility; the command itself was not run because no isolated database was started.

**F-003 reproduction:** Open `/fa` or `/en`. The only account interaction displayed is demo username/password sign-in. Search `lib/auth.ts` for `disableSignUp: true`; search the route/service inventory for recovery implementation—none is present.

**F-001/F-005 reproduction:** Search `src` for `src/services`, `src/actions`, `src/domain`, plan/meal/day data models, or calculation operations. None exist. Browse `/[locale]/demo/T01` and `/[locale]/demo/M01`; the screens are generated from `demo-screens.ts`/`DemoShell`, with sample content and no persistence action.

## M. Improvement roadmap

### Immediate critical fixes

1. Do not market, deploy, or assess the demo as a public MVP. Make the release state explicit to stakeholders.
2. Build and test the P2/P3 manual vertical slice: real authentication lifecycle, onboarding, owner-scoped plan, meal draft/review/confirmation, deterministic totals/adherence, Today/history.
3. Add the privacy lifecycle (at minimum consent records, authorized export/deletion plan and retention behavior) before accepting real user data.

### High-priority improvements

1. Implement technical-spec registration and recovery requirements, and isolate demo credentials/tooling from all public environments.
2. Make services the only data-write path and add two-user adversarial tests from the first owned model.
3. Correct the integration migration expectation as part of the Better Auth migration work; run fresh-migration CI.
4. Establish actual Persian/English dictionary parity and preserve equivalent-route switching/drafts.

### Medium-priority enhancements

1. Add the remaining manual lifecycle: saved/recent meals, day completion/reopen, plans/version history, weight opt-in, reflection/settings, export/deletion.
2. Create journey-level browser/accessibility/mobile tests, including focus/keyboard/error/empty/loading/offline states.
3. Only after the core works, implement private temporary media and optional AI behind consent, structured validation, and safe fallback.

### Long-term / release hardening

1. Measure Core Web Vitals and confirmed-meal latency against the stated targets.
2. Rehearse deployment/migrations/rollback-by-forward-fix/backup restore and validate Darkube/Supabase assumptions.
3. Simplify the remaining dual localization infrastructure before it accrues more product copy.

Dependencies are intentional: the manual vertical slice depends on trustworthy identity and owner-scoped persistence; media/AI depend on the manual slice plus external verification; public release depends on all core journeys, privacy lifecycle, automated acceptance/security evidence, and operational rehearsal.

## N. Open questions and unverified areas

- Is the uncommitted demo/Better Auth work intended as a short-lived course/demo surface or a production feature branch? This materially affects the acceptable fixed demo credential risk and UX interpretation.
- The exact deployed Better Auth/Prisma behavior, session revocation, and recovery-extension viability were not run locally.
- CI results, Docker image build, fresh migrations, E2E, browser visual checks, mobile interactions, and database integration were not observed.
- No production system, user data, provider credentials, Supabase bucket, AI provider, or Darkube environment was accessed.
- No benchmark, accessibility assistive-technology review, design research, usability study, or approved Figma source was available. The alpha visual document cannot establish final visual compliance.

## O. Final professional verdict

1. **Does Dietyaar currently match approved product specifications?** No. It matches foundation portions, not the approved functional MVP.
2. **Does it solve primary user problems effectively?** No. Users cannot enter a real plan, log/confirm meals, or see calculated adherence.
3. **Is meal logging sufficiently fast and intuitive?** Unverified and unavailable; only a static representation exists.
4. **Can users clearly understand adherence and progress?** No functional evidence; Today/history are sample views without calculations.
5. **Is the UI visually professional and consistent?** Promising at demo level, but unapproved alpha direction and untested states prevent a final judgment.
6. **Are Persian RTL and English LTR experiences reliable?** Shell direction/routing is implemented; full product reliability is unverified and demo copy bypasses dictionary parity.
7. **Are implemented features functionally correct?** Foundation static checks pass, but unit/build completion and integration/E2E are unverified here; product features are mostly absent.
8. **Are security and privacy protections adequate?** Adequate only as a foundation direction. Required owner-scoped product data, export/deletion, consent, retention, and adversarial tests are absent.
9. **Is the architecture maintainable?** The target architecture is maintainable and well documented; product-layer maintainability cannot yet be demonstrated because the product layers do not exist.
10. **Is it ready for the next development milestone?** Yes—for controlled implementation of identity/onboarding and the manual vertical slice, after resolving the migration-test mismatch and running validation in an unrestricted environment.
11. **Is it ready for public release?** No. Release is prevented by F-001 through F-012: missing core functionality/privacy lifecycle, absent owner-scoped evidence, incomplete account journey, unverified quality gates, and no deployment/performance/operational evidence.

## Audit execution record

- Read `AGENTS.md`, documentation map, product/design/visual/technical documents, implementation plan, ADRs, configuration/security and migration documentation, source/configuration/test inventory, and applicable installed Next.js route-handler/proxy/error/deployment guides.
- Inspected the whole repository file inventory and current dirty working tree without changing application files.
- Ran safe commands only: `npm run lint:all` passed; `npm test` and `npm run build` were attempted and recorded exactly above.
- This report is the sole audit artifact created.
