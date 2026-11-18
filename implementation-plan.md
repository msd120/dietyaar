# Dietyaar Implementation Plan

Status: execution-ready plan based on repository state inspected 2026-11-16. This document plans work only; it does not change approved product or architecture decisions.

## 1. Executive Summary

Dietyaar is at a sound foundation stage, not a feature-complete MVP. The repository already provides a Next.js 16 App Router shell, strict TypeScript, request-scoped Persian/English localization, local RTL-aware UI primitives, Prisma/PostgreSQL connectivity, environment validation, logging, Docker, CI, Vitest, and Playwright. Product schemas, identity, services, actions, feature routes, domain tests, storage, worker, and AI integrations are intentionally absent.

The implementation should follow seven phases and 36 atomic tasks. The critical path is: validate the dependency/auth baseline; establish identity and owner-scoped persistence; deliver the manual bilingual onboarding-plan-meal-Today vertical slice; complete deterministic domain flows; add private media; add optional jobs/AI; then harden and verify deployment. Manual and deterministic behavior is the release baseline. AI remains optional and feature-flagged, despite older product wording that calls meal-photo recognition required.

The governing conflict rule is Technical Specification §1.2. In particular, implement username/password plus a user-held recovery code (not email OTP), no web push, immediate application-data deletion, temporary images, and optional AI. No unresolved product question blocks the manual vertical slice. External verification blocks deployed identity, storage, AI enablement, nutrition release, and Darkube release claims.

## 2. Sources Reviewed and Repository Baseline

### Sources reviewed

- `AGENTS.md` and `docs/README.md`.
- `docs/product/product-spec.md` v1.3, dated 2026-11-16, including 32 acceptance scenarios and launch gates.
- `docs/design/design-scope.md` v1.3, dated 2026-11-16: A01–A02, O01–O09, T01, M01–M05, H01–H04, P01–P04, S01–S07, L01, J01–J20.
- `docs/design/visual-design.md` alpha (`Supabaze-Inspired-design-analysis`): colors, typography, spacing, components, and responsive behavior. It is the current checked-in visual direction, not evidence of final visual approval.
- `docs/engineering/technical-spec.md` v1.2-draft, dated 2026-11-16, especially precedence/overrides, module ownership, schema contracts, state machines, security, testing, and sequence.
- ADRs 001–008 and 016 as committed records, the technical decision register through ADR-016, and `README.md`.
- Runtime/configuration: `package.json`, lockfile, `.env.example`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `prisma.config.ts`, `Dockerfile`, entrypoint, Compose, CI, Renovate, Vitest, and Playwright configuration.
- Application implementation under `src/`, Prisma schema/migrations, scripts, current unit tests, and foundation E2E tests.
- Installed version-specific Next.js documentation is available under `node_modules/next/dist/docs/` and must be consulted task-by-task for auth handlers, Server Actions, caching, proxy, and runtime behavior.

### Confirmed baseline

| Area                     | Evidence and status                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web/runtime              | Next.js `^16.3.5` (installed build reports 16.4.6), React 19, Node >=22, App Router; reusable with modification.                                           |
| Localization             | `src/i18n/*`, `src/proxy.ts`, `[locale]` layout, `next-intl`, Persian default, RTL direction, digit/date helpers; reusable with extension.                 |
| UI                       | 30+ locally owned primitives exported via `src/components/UiComponents.tsx`, logical utilities, theme tokens, Yekan Bakh; reusable with visual refinement. |
| Architecture enforcement | ESLint prohibits Prisma in pages/components/actions and framework imports in services; reusable as-is, extend for providers/domain.                        |
| Persistence              | Prisma client and PostgreSQL 16 Compose work are scaffolded; `schema.prisma` has no models and no product migration. Missing domain persistence.           |
| Identity                 | Better Auth dependency and env placeholders exist; no handler, adapter, identity facade, tables, or UI. Missing; compatibility spike required.             |
| Feature code             | Only localized foundation page and health route exist. No product routes, services, actions, or domain modules. Missing.                                   |
| Tests                    | Vitest helpers/unit tests and Playwright health/security checks exist; no DB integration or product E2E suite. Reusable with extension.                    |
| Operations               | Structured logger, env validation, health check, standalone Docker, Compose, GitHub CI, Renovate; reusable with modification.                              |
| Storage/jobs/AI          | Dependencies/config comments only; no implementation. Missing and optional after manual slice.                                                             |

### Verification performed

- `npm run lint:all`: passed, including ESLint, RTL smoke check, TypeScript, and Prettier check.
- `npm test`: not executable in this restricted Windows session because Vitest worker creation failed with `spawn EPERM`; no test assertion ran, so this is not evidence of test failure or success.
- `npm run build`: compilation succeeded, then Next.js TypeScript worker creation failed with the same `spawn EPERM`; full build remains unverified in this environment.
- E2E was not run because it requires a running PostgreSQL/browser setup and the task is planning-only.

### Specification currency and authority finding

**Confirmed:** the repository contains product v1.3, design-scope v1.3, and technical v1.2-draft, all updated through 2026-11-16 for ADR-009. The current visual file remains alpha. No newer specification file or approved Figma source is referenced by `docs/README.md` or present in the documented source-of-truth map.

**Assumption used for planning:** the current checked-in file contents are the latest reviewable sources. The technical specification governs conflicts under §1.

**Requires owner approval:** declaring the alpha visual direction final, substituting an unreferenced external design, or changing the newly approved optional-field semantics. None of those changes is made by this plan.

## 3. Specification Analysis

### Functional scope

The essential educational MVP includes public registration/login/recovery, resumable adult onboarding with optional owner-private height, profile weight, gender, and birth year, optional AI consent, manual plan drafting and immutable activation, nutrition catalog/manual foods, meal drafts and confirmation, deterministic totals/alignment, Today/history, saved meals, day completeness, plan version corrections, separately optional weight tracking, deterministic reflections, settings, export, and immediate account deletion. All flows must work in Persian RTL and English LTR.

Optional enhanced-mode features are private plan/meal image upload, AI plan extraction, AI meal recognition, AI-authored reflections, and the PostgreSQL-backed worker. They cannot gate core mode. Explicit non-goals include clinical advice, automatic diet generation, pasted-text/standalone meal-text analysis, public API, Redis, PWA/offline sync, push, payments, social features, barcode scanning, and exercise compensation.

### Core invariants and non-functional requirements

- Every owned read/write derives `userId` from a verified server session and includes it in the database predicate; adversarial two-user tests are mandatory.
- Drafts never affect totals. Plan versions and confirmed nutrient snapshots are immutable; edits create revisions. Null nutrients remain unknown, not zero.
- Canonical persistence uses grams, kilograms, kcal, UTC instants, Gregorian local dates, and normalized digits; presentation uses locale dates/numerals without changing user text.
- Actions authenticate/authorize, normalize and validate with Zod, invoke one service operation, and revalidate. Services own writes; domain code is pure.
- Concurrency uses transactions, revisions, unique/idempotency keys, overlap checks, and stale-result rejection.
- UI supplies loading, empty, error, offline, success, keyboard, screen-reader, reduced-motion, mobile, RTL/LTR, and recovery states.
- Private data is never statically cached. Secrets remain server-only through `src/lib/env.ts`. AI output is schema-validated, untrusted, and draft-only.
- Performance targets include p75 LCP <=2.5s, INP <=200ms, CLS <=0.1 and confirmed-meal p95 <=1.5s, measured rather than assumed.

### Approved conflict resolutions

| Conflict                                   | Plan interpretation                                                                                                                                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product/design email OTP vs technical auth | Technical §1.2 wins: username/password registration/login plus single-use recovery code. Adapt A01/A02/J01 copy and controls.                                                                                                            |
| Product-required AI vs educational core    | Preserve UX/contracts but feature-flag all three AI capabilities; manual/deterministic core is completion.                                                                                                                               |
| Push journey/states                        | Defer all service-worker, permission, subscription, and push work; retain in-app reflections.                                                                                                                                            |
| Delayed deletion                           | Immediately make account unusable and delete application data after password reauthentication; external object cleanup may retry.                                                                                                        |
| Image retention                            | Delete plan image after activation/meal media after confirmation; abandonments expire after seven days.                                                                                                                                  |
| Visual source                              | `visual-design.md` is the current checked-in alpha direction. Use it only to the extent accepted by the source hierarchy; neutral accessible temporary tokens remain permitted, and final visual/copy approval is a public-release gate. |

## 4. Boilerplate Audit and Reuse Strategy

| Classification          | Components                                                                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse as-is             | strict TS aliases; Prisma singleton; logger; action-result/errors; utility/class merging; health route; PostgreSQL Compose service; local primitive ownership; baseline CI shape.                                                 |
| Reuse with modification | locale dictionaries/routing, formatting/date helpers, theme/global tokens, feature page shell, env schema, security headers/CSP, ESLint boundaries, Vitest mocks, Playwright projects, Docker/entrypoint, CI migration/E2E steps. |
| Missing                 | all Prisma models/migrations/seeds; identity facade and Better Auth integration; domain/services/actions; feature screens; integration factories; private storage; exports; worker/jobs; AI adapters.                             |
| Replace/remove          | foundation landing content; legacy message compatibility once all keys migrate; any residual template-only Iran validators not required by product; never revive custom cookie/admin auth.                                        |
| Requires investigation  | Better Auth 1.7/Prisma/Next 16 compatibility and recovery extension; nutrition licenses; Supabase signed upload semantics; Darkube migration/worker/probe behavior; AI model vision/JSON/Persian quality.                         |

No new client state library, repository framework, Redis, chart package, API generator, analytics SDK, or service-worker package is justified. Prefer Server Components, small form islands, URL state, React Hook Form/Zod, services, and existing primitives.

## 5. Specification-to-Codebase Gap Analysis

| Requirement group        | Confirmed implementation                                         | Gap / required change                                                                      | Risk               |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------ |
| Runtime bilingual shell  | Locale routing, layout direction, dictionaries, date/digit tests | Feature keys/routes, key parity enforcement, equivalent-route switch, `dir=auto` user text | Medium             |
| Accessible visual system | Local primitives and tokens                                      | Product shell/signature components, responsive states, final visual/copy approval          | Medium             |
| Identity                 | Dependency/env only                                              | Spike, schema/handler/facade, throttles, recovery, sessions, auth UI                       | High               |
| Onboarding/profile       | None                                                             | Schema, resumable service/actions, O01–O09 equivalents, consent/eligibility                | High               |
| Plans                    | None                                                             | Draft/version schema, pure timeline rules, editor, activation/replacement/correction       | High               |
| Nutrition/meals/days     | None                                                             | Catalog license/seed, portion math, draft/confirm/revise, totals, slots, completeness      | Critical path      |
| Today/history            | None                                                             | Read models and responsive routes/states                                                   | High               |
| Domain completion        | None                                                             | saved meals, weights, reflections, settings, export/deletion                               | Medium–High        |
| Storage/AI               | Env comments/dependencies                                        | Private lifecycle, jobs, adapters, consent/quotas, editable proposals                      | External/blockable |
| Security/operations      | Headers, health, logging, CI/Docker                              | CSP/camera policy, isolation suite, retention jobs, deployment/restore evidence            | High               |

## 6. Implementation Principles and Architecture Alignment

1. Ship vertical behavior: schema/domain/service/action/UI/tests for one journey together.
2. Build core mode first. Provider absence is a tested state, not an exceptional deployment.
3. Keep transport thin and business rules pure. Inject clock, identity, storage, nutrition source, job runner, and AI only at real boundaries.
4. Store immutable snapshots and provenance; recompute only explicitly affected summaries.
5. Treat locale as presentation and timezone as domain input. Never derive historic local dates using the current timezone.
6. Use committed Prisma migrations only; never `db push` or destructive reset.
7. Each feature task adds Persian and English keys, parity checks, ownership tests, failure states, and completion evidence.

## 7. Phase-by-Phase Implementation Roadmap

| Phase                      | Objective and scope                                         | Prerequisites                 | Deliverables / exit gate                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 Foundation validation   | Make the scaffold safe for product work.                    | Current repository            | Compatibility evidence, migration/test harness, hardened config, product shell. `lint:all`, unit harness, fresh migration, build pass outside restricted sandbox. |
| P2 Identity and onboarding | Establish trustworthy actor and resumable profile.          | P1                            | Auth/recovery/session flows and O01–O09-equivalent manual onboarding in both locales; cross-account tests pass.                                                   |
| P3 Manual vertical slice   | Deliver plan → meal → Today/history without AI.             | P2                            | One complete J01/J03/J05/J07 path, deterministic calculations, mobile bilingual E2E. This is the first product milestone.                                         |
| P4 Domain completion       | Complete manual plan/day/account lifecycle.                 | P3                            | J06/J08–J18 excluding overridden push/queued deletion; deterministic release behavior.                                                                            |
| P5 Private media           | Add secure temporary image boundary.                        | P4; Supabase verification     | Owned signed upload/finalize/access/delete lifecycle with retention and adversarial tests.                                                                        |
| P6 Optional jobs and AI    | Add enhanced mode without weakening core.                   | P5; provider/worker decisions | Durable jobs and three editable/fallback AI features, disabled-by-default and fully mocked in CI.                                                                 |
| P7 Hardening and delivery  | Prove security, accessibility, performance, and deployment. | P1–P6 as enabled              | Acceptance matrix, isolation suite, release evidence, Darkube rehearsal, documented residual limitations.                                                         |

## 8. Detailed Implementation Tasks

All proposed paths below are explicitly marked “proposed”; existing paths are named “existing.” Every task must preserve unrelated user changes.

### P1 — Foundation validation

#### FND-01 — Verify and pin the supported baseline

- **Objective / requirements:** Satisfy Technical §§3, 7.1, 25.1, 30 without adding features.
- **Repository context / files:** existing `package.json`, lockfile, `.nvmrc`, Prisma/Next config; consult installed Next docs. Proposed `docs/engineering/compatibility-report.md` only if the team wants durable spike evidence.
- **Implementation:** run audit/version matrices; create a disposable Better Auth username/Prisma/Next compatibility spike in tests; verify session creation/revocation and adapter migrations; record findings. Do not implement domain auth here.
- **Dependencies:** none. **Acceptance:** exact adopted versions are reproducible; no unresolved critical/high runtime vulnerability; Better Auth gate has a pass/fail decision and fallback requires owner approval.
- **Validation / evidence:** `npm ci`, audit assessment, `prisma generate`, focused spike tests, `lint:all`, build log; provide report and command outputs.
- **Risks:** external docs/version drift; dependency changes require lockfile review and are implementation-time work.

#### FND-02 — Establish migration and database integration harness

- **Objective / requirements:** Technical §§9, 23, 25; product acceptance 20.
- **Context / files:** existing empty `prisma/schema.prisma`, migration lock, Compose, Vitest. Proposed `prisma/migrations/*`, `src/__tests__/integration/*`, test factories.
- **Implementation:** define migration conventions and isolated test DB lifecycle; add foundation metadata only when required by subsequent schemas; verify fresh deploy and rollback-by-forward-fix procedure.
- **Dependencies:** FND-01. **Acceptance:** fresh PostgreSQL applies all committed migrations; tests never target a non-test URL; no `db push/reset` workflow.
- **Validation / evidence:** `db:deploy`, schema constraint probes, CI log and migration SQL review.
- **Risks:** CI/local DB isolation and concurrent test cleanup.

#### FND-03 — Extend configuration and security boundaries

- **Objective / requirements:** Technical §§4.2, 5.2, 19, 21.
- **Context / files:** existing `.env.example`, `src/lib/env.ts`, `next.config.ts`, logger, ESLint. Proposed typed feature flags/provider settings.
- **Implementation:** validate core vs enhanced env; keep secrets server-only; update permissions policy for user-initiated camera capture when media ships; add CSP after endpoint inventory; extend lint restrictions to domain/providers where needed.
- **Dependencies:** FND-01. **Acceptance:** core boots without Supabase/AI; enabling a feature requires its config; client bundles contain no privileged keys.
- **Validation / evidence:** env unit tests, production bundle inspection, header tests, build.
- **Risks:** premature CSP can break Next/Supabase; stage directives and test them.

#### FND-04 — Build the bilingual application shell and test matrix

- **Objective / requirements:** Design §1.1, visual responsive rules, J14; product acceptance 17, 21–23.
- **Context / files:** existing `[locale]` layout/page, dictionaries, globals, UI barrel, Playwright desktop-only config. Proposed route groups, navigation shell, error/loading/not-found boundaries, mobile Playwright project.
- **Implementation:** create authenticated shell/navigation placeholders without feature behavior; add locale-equivalent navigation, dictionary parity test, user-text bidi wrapper, offline/retry boundary, responsive/reduced-motion coverage.
- **Dependencies:** FND-03. **Acceptance:** `/fa` and `/en` render correct direction/numerals; locale switch preserves route; all icon controls are named; no physical-direction lint violations.
- **Validation / evidence:** RTL/LTR screenshots, keyboard/a11y smoke, parity unit test, mobile/desktop E2E.
- **Risks:** the checked-in visual direction is alpha; use neutral accessible temporary tokens where its approval is uncertain, and keep final visual/copy approval as an external release gate.

### P2 — Identity and onboarding

#### IDN-01 — Implement Better Auth behind `IdentityService`

- **Objective / requirements:** Technical §§7–8; adapted A01/A02/J01.
- **Context / files:** Better Auth dependency/env; proposed auth handler, provider config, identity service/facade, Prisma auth migration.
- **Implementation:** public unique normalized username/password registration, login/logout, secure cookie sessions, generic errors, password policy, session revocation; pages/routes consume only facade/session helper.
- **Dependencies:** FND-01–03. **Acceptance:** no email/phone/admin/custom-cookie auth; actor ID always comes from verified session; redirect is localized.
- **Validation / evidence:** auth unit/DB/E2E, cookie/header inspection, migration and handler logs.
- **Risks:** compatibility failure is blocking and requires owner-approved alternative.

#### IDN-02 — Add persistent auth throttling and audit events

- **Objective / requirements:** Technical §§7, 19 and public-registration abuse risk.
- **Context / files:** proposed throttle/audit models and identity service operations.
- **Implementation:** persistent keyed rate limits for registration/login/recovery, generic responses, bounded audit metadata without raw secrets/health content.
- **Dependencies:** IDN-01. **Acceptance:** restart does not reset limits; usernames cannot be enumerated; successful auth is not logged with credentials.
- **Validation / evidence:** clock-injected unit tests, DB concurrency tests, redacted logs.
- **Risks:** denial-of-service from overly broad keys; document thresholds.

#### IDN-03 — Implement recovery-code lifecycle

- **Objective / requirements:** Technical §7.3 and §1.2 override.
- **Context / files:** proposed recovery credential model/service and localized recovery screens.
- **Implementation:** generate high-entropy code once, store hash only, require save confirmation, permit username+code password recovery, atomically consume/rotate code, revoke sessions.
- **Dependencies:** IDN-01–02. **Acceptance:** code is never recoverable from DB/logs; reuse/races fail; losing both credentials is clearly disclosed.
- **Validation / evidence:** hashing, single-use race, enumeration, session revocation E2E.
- **Risks:** Better Auth extension boundary must not patch vendor internals unsafely.

#### ONB-01 — Model profile, preferences, consent, and onboarding state

- **Objective / requirements:** Product §6; Technical §9.1; O01–O05/J02/J16.
- **Context / files:** proposed Prisma profile/consent/preference/onboarding migration, pure schemas, profile service.
- **Implementation:** persist age eligibility result, versioned required Terms/Privacy acceptance, optional name, units, timezone, morning-message time, goal, authorship, dietary text, appearance, AI consent revision, weight-tracking opt-in, and completed step. Add nullable canonical `heightCm`, `profileWeightKg`, gender/self-description, and a paired `birthYear` plus `birthYearCalendar` (`jalali` or `gregorian`). Represent plan-image, meal-image, and AI-reflection consent as three purpose-specific records even if one onboarding control grants or declines them together. Keep age authoritative for eligibility. Normalize metric/imperial input to centimeters/kilograms and locale digits before validation; preserve the tagged birth year across locales rather than performing a lossy year-only conversion; profile weight must not set tracking or create a `WeightEntry`.
- **Dependencies:** IDN-01, FND-02. **Acceptance:** owner-scoped idempotent saves; under-18 cannot proceed; required legal acceptance is versioned/auditable; each optional AI purpose is independently represented, withdrawable, and auditable; default morning time is 08:00 in the selected timezone; all four personal fields are independently nullable; entered measurements use canonical units; birth year/calendar are both null or both valid and do not overwrite age; profile weight neither enables tracking nor creates history; text is normalized only per approved Persian rules.
- **Validation / evidence:** schema/service tests including two users, all/some/no optional fields, edit/clear, invalid and unusual measurements, Persian/Arabic-Indic/Latin digits, Jalali/Gregorian year round trips and eligibility conflicts, profile-weight/tracking separation, invalid timezone, and concurrent saves.
- **Risks:** do not collect medical diagnoses; store only eligibility declaration.

#### ONB-02 — Deliver resumable bilingual onboarding

- **Objective / requirements:** O01–O06/O09, J01–J04/J14; acceptance 1, 21, 31.
- **Context / files:** proposed onboarding routes/components/actions and both dictionaries.
- **Implementation:** focused step pages with Back, refresh/resume, server saves, clinical boundary, continue-without-plan, timezone/morning-time/appearance; adapt auth steps to username/password and omit push controls. O03 clearly labels height, profile weight, gender, and birth year optional; permits any subset; provides Skip/Continue; uses inclusive gender choices and bounded self-description; and provides Jalali-friendly Persian and Gregorian English birth-year presentation without requesting a full birth date. Finish through the localized post-onboarding handoff supplied by the foundation shell; the complete Today and Log meal behavior remains UI-01 scope.
- **Dependencies:** ONB-01, IDN-03, FND-04. **Acceptance:** first incomplete step resumes with partial optional values; Back/edit/clear works; empty optional fields never error; invalid entered values receive localized feedback and can be cleared/skipped; copy does not pressure disclosure; editing dependencies cannot bypass eligibility or required legal acceptance; users entering all, some, or none reach the localized post-onboarding handoff without a broken route or lost state. End-to-end Add plan/Log first meal behavior is accepted only after UI-01.
- **Validation / evidence:** Persian/English mobile E2E for all/some/no optional fields, back, refresh/resume, edit/clear, invalid values, calendar/numeral behavior, profile-weight tracking-disabled state, clinical block, and no-plan path.
- **Risks:** preserve user-entered mixed-language text across locale switch.

### P3 — Manual vertical slice

#### PLN-01 — Define plan domain and persistence

- **Objective / requirements:** Product §7; Technical §§9.2, 9.6–9.7, 10–11.
- **Context / files:** proposed plan schema/migration, `src/domain/plans`, `src/services/plans`.
- **Implementation:** draft structures, daily/weekly templates, slots, foods/portions, alternatives, typed rules/targets/source text, immutable versions/effective intervals; pure overlap/default-date/eligibility rules.
- **Dependencies:** ONB-01, FND-02. **Acceptance:** qualitative plans valid; unresolved/medical drafts cannot activate; first plan defaults today; DB prevents invalid ownership/timeline states.
- **Validation / evidence:** pure boundary tests, migration constraints, owner isolation, timezone date cases.
- **Risks:** PostgreSQL exclusion/transaction design must match Prisma capabilities; use reviewed SQL migration where necessary.

#### PLN-02 — Implement manual plan editor, review, and activation

- **Objective / requirements:** O06–O08, P01–P03, J03/J04; acceptance 2–3, 25.
- **Context / files:** proposed plan actions/routes/feature components and locale keys.
- **Implementation:** manual structured creation, autosave, seven-day/repeating editor, review of unknowns/alternatives/targets, explicit activation transaction, Today redirect.
- **Dependencies:** PLN-01, ONB-02. **Acceptance:** UI never invents targets/equivalence; activation is idempotent; numeric panels hidden when unsupported; errors retain draft.
- **Validation / evidence:** service integration and bilingual E2E for qualitative, medical, overlap, double-submit.
- **Risks:** complex form should remain small islands, not global client state.

#### NUT-01 — Add versioned nutrition catalog and user foods

- **Objective / requirements:** Product §9; Technical §18; acceptance 4–6, 20.
- **Context / files:** proposed catalog models, `prisma/seeds/nutrition/v1.*`, nutrition service/domain.
- **Implementation:** after license approval, seed sourced Iranian-relevant foods/servings with version/provenance; search; gram/household portion resolution; private user foods; manual nullable nutrients.
- **Dependencies:** FND-02; nutrition source/license is an external release blocker but development can use clearly non-production fixtures.
- **Acceptance:** no invented values; portion scaling deterministic; null remains null; user foods owner-isolated.
- **Validation / evidence:** seed checksum/source record, portion/property tests, search/ownership DB tests.
- **Risks:** catalog coverage/licensing; fixtures must not masquerade as release data.

#### MEL-01 — Implement meal drafts and deterministic review

- **Objective / requirements:** M01–M03, J05–J08; Product §§8–10.
- **Context / files:** proposed meal draft schema/service/actions/UI and pure nutrient aggregation.
- **Implementation:** metadata/date/time/type, slot/unplanned mapping, catalog/manual items, portions, unknown acknowledgement, recent/saved-source snapshot input; default using entry timezone.
- **Dependencies:** PLN-01, NUT-01. **Acceptance:** drafts never affect totals; all estimates show source; changing portion recalculates; unknown comparisons unavailable.
- **Validation / evidence:** domain unit tests, owner/stale revision integration tests, bilingual form E2E.
- **Risks:** entry local date and `timezoneAtEntry` must be stored, not recomputed later.

#### MEL-02 — Confirm one immutable meal idempotently

- **Objective / requirements:** Technical concurrency matrix; acceptance 4, 7, 9.
- **Context / files:** proposed confirmed meal/item revisions, idempotency record, meal service confirm operation/action.
- **Implementation:** transactionally revalidate owner/draft/revision/slot, snapshot nutrients/provenance/plan version, insert once by idempotency key, update affected summary revision.
- **Dependencies:** MEL-01. **Acceptance:** double tap/concurrent confirm yields one meal; stale draft fails safely; partial day is never labeled non-adherent.
- **Validation / evidence:** real-DB race tests and E2E double click; transaction audit.
- **Risks:** do not calculate in the action/UI.

#### DAY-01 — Implement deterministic day summary and alignment

- **Objective / requirements:** Product §10; Technical §10; T01/H02; acceptance 5–8.
- **Context / files:** proposed pure day calculations, day service/read models.
- **Implementation:** known totals/completeness flags, min/max/range rules, qualitative slot matching, skipped/not-recorded states, explanation facts; cache only by owner/source revision if needed.
- **Dependencies:** MEL-02, PLN-01. **Acceptance:** unknown values never produce false claims; incomplete days avoid adherence judgment; one plan version applies per date.
- **Validation / evidence:** exhaustive table tests, timezone/version DB tests, explainability snapshots.
- **Risks:** distinguish zero from unknown and partial from complete in types.

#### UI-01 — Deliver Today and seven-day manual journey

- **Objective / requirements:** T01, H01–H02, J01/J05–J07/J11; acceptance 10, 21.
- **Context / files:** proposed `(app)/today`, history/day routes, product navigation/components.
- **Implementation:** server-render read models; persistent Log meal action; reflection placeholder; date navigation; plan/no-plan/empty/loading/error/offline states; add/edit entry points.
- **Dependencies:** DAY-01, FND-04. **Acceptance:** confirmed meal immediately appears once with correct known totals; seven-day list changes only affected date; core journey works mobile Persian and English.
- **Validation / evidence:** J01/J05/J07 bilingual Playwright traces/screenshots, keyboard/a11y checks, query count measurement.
- **Risks:** avoid private response caching and client duplication.

### P4 — Domain completion

#### PLN-03 — Add replacement, history, and historical correction

- **Objective / requirements:** P01–P04/J13; acceptance 11, 25, 30.
- **Context / files:** extend plan service/routes; proposed audit/recompute records.
- **Implementation:** clone-as-draft option, tomorrow default, explicit effective override, atomic close/activate, historical-impact preview, audited past correction, targeted summary invalidation.
- **Dependencies:** PLN-02, DAY-01. **Acceptance:** no overlaps; history immutable/owner-only; unaffected dates unchanged.
- **Validation / evidence:** concurrency/timeline/ownership DB tests and J13 E2E.
- **Risks:** correction fan-out must be bounded and transactional or durably resumed.

#### MEL-03 — Add confirmed-meal revision, delete, and undo

- **Objective / requirements:** M04/J09/J11; acceptance 10.
- **Context / files:** extend meal revisions/service/actions/UI.
- **Implementation:** optimistic revision guard; edit creates committed revision; soft-delete/tombstone with 10-second owner-bound undo; reopen day and recompute slot/summary.
- **Dependencies:** MEL-02, DAY-01. **Acceptance:** stale writes fail; undo restores exactly once; removed linked meal does not silently restore skipped state.
- **Validation / evidence:** clock/race/summary tests and Today/history E2E.
- **Risks:** undo token must not authorize another owner.

#### MEL-04 — Complete saved/recent meals and slot lifecycle

- **Objective / requirements:** M05/J08/J10; acceptance 26, 28.
- **Context / files:** proposed saved meal models/service/UI; extend day slot operations.
- **Implementation:** snapshot saved templates, clone into independent draft, recent query, explicit skip/unskip/link rules, day complete/reopen transaction.
- **Dependencies:** MEL-03. **Acceptance:** template edits never mutate history; linked meal clears skip; mutation reopens complete day with explanation.
- **Validation / evidence:** independence/slot state-machine tests and E2E.
- **Risks:** recent results must be owner-scoped and bounded.

#### WGT-01 — Implement opt-in weight history

- **Objective / requirements:** H03–H04/J12; acceptance 27, 31.
- **Context / files:** proposed weight model/service/actions/components.
- **Implementation:** enable tracking separately, canonical kg conversion with unusual-value clarification, CRUD by local measurement date, neutral two-point trend; disabling hides without deleting. If nullable profile weight exists, offer it only as a prefill after explicit opt-in; require the user to confirm value and measurement date before creating the first `WeightEntry`. Never synchronize later profile edits into history.
- **Dependencies:** ONB-01, FND-04. **Acceptance:** saving/editing profile weight does not change tracking or history; explicit opt-in alone creates no entry; a prefilled first entry is created only after confirmation; no BMI/meal attribution/target change.
- **Validation / evidence:** conversion/ownership/CRUD tests, profile-weight separation and no-auto-entry tests, and bilingual E2E with/without profile weight.
- **Risks:** unit changes must not reinterpret stored values.

#### REF-01 — Implement deterministic reflections and feedback

- **Objective / requirements:** Product §12, J15; acceptance 12, 18, 24, 29.
- **Context / files:** proposed reflection engine/model/service/Today card and locale templates.
- **Implementation:** generate on demand from allowlisted calculated facts, unique per user/local date/source revision, no-data templates, stale snapshot marker, idempotent optional binary feedback.
- **Dependencies:** DAY-01. **Acceptance:** no AI call in core/no-consent mode; supportive copy makes only supported observations; timezone changes do not duplicate.
- **Validation / evidence:** template/fact/timezone/concurrency tests, E2E card/feedback.
- **Risks:** localized prose must be reviewed and never label food/person morally.

#### SET-01 — Complete settings, profile, locale, consent, and legal surfaces

- **Objective / requirements:** S01–S05/L01/J14/J16.
- **Context / files:** proposed settings routes/actions and dictionaries.
- **Implementation:** profile/goal/preferences, edit/clear optional height, profile weight, gender/self-description, and birth year, equivalent-route locale switch, appearance/timezone, AI-purpose disclosure and withdrawal, separate weight-tracking toggle, privacy/legal pages; no push settings. Reuse onboarding normalization/validation and keep profile weight visibly distinct from tracked history.
- **Dependencies:** ONB-01, REF-01, FND-04. **Acceptance:** optional profile edits are owner-scoped and do not affect eligibility, plan targets, tracking state, or existing `WeightEntry` rows; withdrawal disables future AI entry points/jobs while retaining confirmed data; text and the tagged birth-year/calendar value are unchanged across locale switches.
- **Validation / evidence:** settings ownership and locale E2E, dictionary parity.
- **Risks:** timezone change affects future defaults, not historic entry dates.

#### ACC-01 — Implement private data export

- **Objective / requirements:** S06/J17; acceptance 19.
- **Context / files:** proposed export service/model/route; core may generate synchronously within budget, enhanced mode may queue.
- **Implementation:** produce an owner-scoped, versioned archive manifest with UTF-8 JSON and CSV for tabular data. Include profile—explicitly including nullable height, profile weight, gender/self-description, and tagged birth year/calendar—preferences, purpose-specific consents, plan versions, meals and provenance, saved meals, user foods, day state, tracked weight entries as a distinct collection, and reflections; exclude password/session/recovery hashes, throttles, deleted raw images, and secrets. Enforce one active request, authenticated expiring download, and cleanup.
- **Dependencies:** PLN-03, MEL-04, WGT-01, REF-01. **Acceptance:** complete, retryable, no cross-account access; failure does not expose partial public file.
- **Validation / evidence:** fixture contract, expiry/ownership tests, J17 E2E.
- **Risks:** storage design may move final artifact work to P5; safe in-memory/streaming fallback is allowed for small core exports.

#### ACC-02 — Implement immediate account deletion

- **Objective / requirements:** S07/J18 as overridden; Technical §19.
- **Context / files:** proposed account service/action, deletion/audit/cleanup records.
- **Implementation:** password reauthenticate, terminal deletion state, revoke sessions, delete the profile including all four optional personal attributes and all other owned application/identity data transactionally, enqueue/retry only external media cleanup, show honest backup limitation.
- **Dependencies:** IDN-01, SET-01, implemented core domain services, ACC-01. **Acceptance:** account becomes unusable immediately; repeated/partial attempts converge; active copies are removed; another account is unaffected. Later media/job modules must register cleanup/cancellation behavior and extend this lifecycle test before they are enabled.
- **Validation / evidence:** full lifecycle and injected partial-failure tests, session test, data inventory proof.
- **Risks:** Better Auth deletion ordering and foreign keys require a rehearsed transaction design.

### P5 — Private media

#### MED-01 — Verify Supabase private-storage contract

- **Objective / requirements:** Technical §§15, 20, 32.
- **Context / files:** Supabase dependency/env only; proposed provider contract tests.
- **Implementation:** with a non-production project, verify private bucket, signed upload/download TTL, service-role scope, size/type metadata, deletion/listing, latency, and lifecycle behavior; document fallback.
- **Dependencies:** FND-03; external credentials. **Acceptance:** no public object URL and all assumptions evidenced.
- **Validation / evidence:** sanitized integration logs/config checklist.
- **Risks:** this blocks storage enablement, not manual product work.

#### MED-02 — Implement owned upload/finalization and cleanup

- **Objective / requirements:** Product §§7–8/18; Technical §15; acceptance 13, 16.
- **Context / files:** proposed media model/service, storage adapter, upload/finalize routes, cleanup operation.
- **Implementation:** authorize purpose/consent/feature, create owned row/object key, short signed upload, server verify/re-encode/strip metadata where supported, finalize, narrow access, delete after activation/confirmation, expire abandoned after seven days.
- **Dependencies:** MED-01, IDN-01. **Acceptance:** filename/MIME claims are untrusted; media access is owner-only; signed URLs are never logged. Job ownership is covered separately when JOB-01 exists.
- **Validation / evidence:** malicious metadata/type/oversize, expiry, two-user, cleanup tests.
- **Risks:** image processing package is allowed only after spike proves needed and safe.

#### MED-03 — Add plan and meal image capture UX with manual fallback

- **Objective / requirements:** O06/M01/J19/J20; acceptance 15.
- **Context / files:** extend plan/meal routes, permissions policy, feature flags.
- **Implementation:** user-initiated camera/file input for JPEG/PNG/WebP <=10MB, progress/cancel/retry, permission-denied upload/manual alternatives; without AI, media entry is hidden or clearly unavailable while manual remains primary.
- **Dependencies:** MED-02, FND-04. **Acceptance:** denied permission/network failure retains draft; no push permission state.
- **Validation / evidence:** mobile browser mocked permission/upload failure E2E.
- **Risks:** browser camera behavior varies; file upload is mandatory fallback.

### P6 — Optional jobs and AI

#### JOB-01 — Implement PostgreSQL queue and worker

- **Objective / requirements:** Technical §16 and transaction matrix.
- **Context / files:** proposed job schema/service, `src/worker/*`, worker script/Docker command.
- **Implementation:** atomic claim with lease, attempt/backoff, heartbeat, idempotent handler result, stale revision/consent/flag recheck, cancellation, terminal sanitized errors; no Redis.
- **Dependencies:** FND-02, FND-03, IDN-01; worker deployment may remain local until Darkube verification.
- **Acceptance:** crashed lease recovers, duplicate worker does not duplicate result, core web works without worker.
- **Validation / evidence:** clock/concurrency/crash tests and separate worker health log.
- **Risks:** database polling load; respect specified budgets.

#### AI-01 — Implement provider-neutral AI boundary and controls

- **Objective / requirements:** Product §15; Technical §17; acceptance 13, 24, 32.
- **Context / files:** proposed provider interface, DeepSeek candidate adapter, schemas, quota service.
- **Implementation:** server-only provider, strict structured-result validation, error taxonomy, timeouts, global/purpose flags, per-user quota, consent and revision checks, allowlisted payloads, no nutrient authority.
- **Dependencies:** JOB-01; live provider verification for enablement.
- **Acceptance:** malformed/rate-limit/timeout produces safe status/manual fallback; no keys/payload health content in logs.
- **Validation / evidence:** mocked contract/failure tests; live evaluation report is release evidence only.
- **Risks:** model vision/JSON/Persian/retention remains externally unverified.

#### AI-02 — Add editable plan-image extraction proposals

- **Objective / requirements:** Product §7/J19; acceptance 2, 13–14.
- **Context / files:** extend media/jobs/plan draft review.
- **Implementation:** enqueue owned image/revision, parse schema to proposal with source/ambiguities, merge only into same current draft after user action, never activate, delete image after activation.
- **Dependencies:** AI-01, MED-03, PLN-02. **Acceptance:** stale result cannot overwrite edits; missing targets remain missing; retry/manual paths survive refresh.
- **Validation / evidence:** mocked Persian/English/mixed fixtures, stale/race/failure E2E.
- **Risks:** evaluation dataset and final provider approval block feature enablement.

#### AI-03 — Add editable meal-photo recognition proposals

- **Objective / requirements:** Product §8/J19; acceptance 4, 13, 32.
- **Context / files:** extend media/jobs/meal review and nutrition resolver.
- **Implementation:** recognition proposes foods/portions/preparation/uncertainty only; user maps to catalog/manual/unknown nutrients and confirms via MEL-02; delete media after confirmation.
- **Dependencies:** AI-01, MED-03, MEL-01, MEL-02, NUT-01. **Acceptance:** AI is never nutrient provenance and never changes totals before confirmation; ambiguous items remain editable/unresolved.
- **Validation / evidence:** mocked Iranian-food set, multiple/low-quality/failure cases, correction metrics.
- **Risks:** required in older product wording but optional under governing override.

#### AI-04 — Add optional AI reflection writing

- **Objective / requirements:** J15/J16; acceptance 18, 24, 29.
- **Context / files:** extend reflection/job services.
- **Implementation:** send only allowlisted structured facts when consent/flag active; validate safe localized copy; persist source method/revision; fall back deterministically on every failure/withdrawal.
- **Dependencies:** AI-01, REF-01. **Acceptance:** output cannot introduce unsupported facts/advice; deterministic result is always available.
- **Validation / evidence:** prompt payload allowlist, safety/failure/withdrawal tests.
- **Risks:** user-facing copy requires review; no open-ended chat.

### P7 — Hardening and delivery

#### QLT-01 — Complete security and ownership test campaign

- **Objective / requirements:** Technical §§8, 19, 23; acceptance 16.
- **Context / files:** all services/routes/actions; proposed shared two-user adversarial suite.
- **Implementation:** enumerate every owned entity/operation and test read/write/list/download/job/export/undo/revision boundaries; test CSRF/same-origin, session expiry, validation, secrets/log redaction.
- **Dependencies:** implemented core, plus optional modules when enabled. **Acceptance:** every owned lookup has an adversarial test; no IDOR or client-supplied actor.
- **Validation / evidence:** coverage matrix and passing DB/E2E logs.
- **Risks:** mock-only tests are insufficient; use real PostgreSQL.

#### QLT-02 — Complete bilingual accessibility, resilience, and performance gates

- **Objective / requirements:** Product §13/19; design all states; acceptance 17, 20–23.
- **Context / files:** all UI and Playwright config.
- **Implementation:** critical journeys in fa/en at mobile/desktop; keyboard/focus/screen-reader names/contrast/reduced motion; offline/database/provider injected failure; measure CWV, meal save latency/query counts and optimize only evidenced bottlenecks.
- **Dependencies:** core journey; optional tests conditional on flags. **Acceptance:** stated budgets or documented blocker; no spinner without recovery; key parity and RTL lint pass.
- **Validation / evidence:** Playwright traces/screenshots, accessibility results, performance report.
- **Risks:** CI/browser variance; use representative device/network profile.

#### OPS-01 — Rehearse Docker, migrations, Darkube, and recovery

- **Objective / requirements:** Technical §§20–25, 30–32.
- **Context / files:** existing Docker/entrypoint/CI/health; proposed worker command and deployment runbook.
- **Implementation:** separate one-off migration from replica start; verify web/optional worker commands, probes, secrets, pooler/TLS/DNS, logs, gradual deploy/rollback, best-effort export/restore and Supabase pause behavior.
- **Dependencies:** core complete; live Darkube/Supabase access. **Acceptance:** fresh environment deploys via committed migrations; rollback and limitations documented; no unsupported RPO/RTO claim.
- **Validation / evidence:** timestamped deployment/recovery checklist and logs.
- **Risks:** external platform capability and latency are blocking for deployed MVP claims.

#### REL-01 — Close traceability and release evidence

- **Objective / requirements:** all specification acceptance and Technical §23.3/30.
- **Context / files:** this plan, specs, README, ADRs; proposed acceptance evidence document.
- **Implementation:** execute matrix, record enabled/disabled features, unresolved release gates, nutrition/provider evaluations, legal/clinical/visual approvals; update source-of-truth and add ADR only for approved decision changes.
- **Dependencies:** all intended release tasks. **Acceptance:** no silently omitted requirement; all gates have evidence, explicit deferral, or owner-approved blocker.
- **Validation / evidence:** `npm run lint:all`, `npm test`, `npm run build`, DB integration/E2E, fresh migration, signed checklist.
- **Risks:** passing software tests does not replace external privacy, nutrition, or clinical review.

## 9. Task Dependencies and Critical Path

Critical path:

`FND-01 → FND-02/03 → IDN-01 → ONB-01/02 → PLN-01/02 + NUT-01 → MEL-01/02 → DAY-01 → UI-01 → domain completion → QLT-01/02 → OPS-01 → REL-01`.

Safe parallelization:

- FND-02, FND-03, and early FND-04 can proceed after the baseline decision.
- IDN-02/03 and ONB-01 can proceed after IDN-01 contracts stabilize.
- NUT-01 can run alongside PLN-01/02; visual shell work can run alongside services.
- After UI-01, PLN-03, WGT-01, REF-01, and much of SET-01 are independent.
- MED-01 can be investigated during P4, but MED-02/03 must not distract from the manual slice.
- AI-02, AI-03, and AI-04 can proceed in parallel after AI-01 and their domain dependencies.

External blockers are scoped: Better Auth verification blocks P2; nutrition license blocks release catalog, not fixture-based domain development; Supabase blocks P5 only; AI account/model approval blocks feature enablement only; Darkube access blocks OPS-01 deployment evidence only.

## 10. Testing Strategy and Quality Gates

| Layer                  | Required coverage                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure unit              | date/timezone mapping, Persian digit normalization, units/portions, nullable aggregation, plan timeline, alignment, state machines, reflection facts. |
| Service unit           | injected identity/clock/provider error mapping and orchestration without framework.                                                                   |
| PostgreSQL integration | migrations, constraints, transactions, races, idempotency, overlap, revisions, owner isolation, cascades/deletion.                                    |
| Component/UI           | validation/accessibility behavior where E2E is too coarse; avoid snapshot-only confidence.                                                            |
| Playwright             | fa/en mobile/desktop critical journeys, auth/recovery, resume, manual plan/meal/Today/history, settings, export/deletion; optional AI with mocks.     |
| Operational            | fresh migration, production build, Docker image, health/readiness, web/worker modes, deployment/restore rehearsal.                                    |

Phase gates are the exit criteria in §7. Every pull request runs the verified repository commands `npm run lint:all`, `npm test`, and `npm run build`; schema work additionally runs fresh `npm run db:deploy`; product journey work runs relevant `npm run test:e2e`. `npm run test:coverage` remains the CI command, but coverage percentage is diagnostic unless the team approves a meaningful threshold. Failures caused by constrained execution environments must be reported distinctly and rerun in CI/unrestricted development.

## 11. Requirements Traceability Matrix

| Requirement/spec reference       | Tasks                                                               | Verification                                                              | Status after plan                          |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| A01/A02, Tech §1.2 auth override | IDN-01–03                                                           | auth DB/E2E/security                                                      | Planned                                    |
| O01–O05, O09, J01/J02/J04        | ONB-01/02                                                           | bilingual eligibility and all/some/no optional-profile-field resume E2E   | Planned                                    |
| O06–O08, P01–P04, J03/J13        | PLN-01–03                                                           | timeline/unit/DB/E2E                                                      | Planned                                    |
| M01–M05, J05–J09                 | NUT-01, MEL-01–04                                                   | calculations/races/E2E                                                    | Planned                                    |
| T01, H01/H02, J10/J11            | DAY-01, UI-01, MEL-03/04                                            | summary/state E2E                                                         | Planned                                    |
| H03/H04, J12                     | WGT-01                                                              | conversion/CRUD/profile-weight-separation E2E                             | Planned                                    |
| J14 and acceptance 21–23         | FND-04, ONB-02, SET-01, QLT-02                                      | parity/RTL/round-trip E2E                                                 | Planned                                    |
| J15/J16, acceptance 18/24/29     | REF-01, SET-01, AI-04                                               | no-consent/fallback/safety tests                                          | Planned; AI optional                       |
| J17/export                       | ACC-01                                                              | archive contract/expiry/ownership                                         | Planned                                    |
| J18/S07 deletion override        | ACC-02                                                              | lifecycle/partial failure/session                                         | Planned                                    |
| J19 image paths                  | MED-01–03, JOB-01, AI-01–03                                         | storage ownership/mocked AI/evaluation                                    | Planned; optional enhanced mode            |
| J20 outage/permission            | FND-04, MED-03, AI-01, QLT-02                                       | injected failures/permission E2E                                          | Planned; push portion deferred by override |
| Product acceptance 1–12          | ONB-02, PLN-01–03, NUT-01, MEL-01–04, DAY-01, REF-01                | unit/DB/core E2E                                                          | Planned                                    |
| Product acceptance 13–16         | MED-02/03, AI-01–03, QLT-01                                         | mocked failure/isolation                                                  | Planned; push clause not applicable        |
| Product acceptance 17–20         | QLT-02, ACC-01/02, OPS-01                                           | a11y/lifecycle/fresh deploy                                               | Planned                                    |
| Product acceptance 25–32         | ONB-01/02, PLN-03, MEL-04, WGT-01, SET-01, ACC-01/02, REF-01, AI-03 | optional-profile/calendar/export/deletion plus targeted DB/E2E/evaluation | Planned; AI optional by override           |
| Tech security/operations §§19–25 | FND-03, QLT-01/02, OPS-01, REL-01                                   | security and release evidence                                             | Planned                                    |
| Web push                         | none                                                                | N/A                                                                       | Intentionally deferred by Tech §1.2        |
| Deferred product/non-goals       | none                                                                | scope review in REL-01                                                    | Intentionally excluded                     |

No important approved core requirement lacks a task. AI requirements are preserved but explicitly conditional; push-only requirements are superseded rather than partially implemented.

## 12. Risks, Assumptions, and Open Questions

| Class                    | Risk/question and evidence                                                                                                       | Impact                                                    | Mitigation / related tasks                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Blocking P2              | Does pinned Better Auth support the required Next/Prisma/session and safe recovery extension? Technical marks verification gate. | Identity cannot proceed safely.                           | FND-01; owner decision only if spike fails.                                            |
| Blocking release catalog | Which nutrition sources/licenses and initial Iranian-food coverage are approved?                                                 | Cannot ship trusted seeded values.                        | NUT-01 uses labeled fixtures for development; release waits for approval.              |
| Blocking P5              | Supabase private signed flow, quotas, lifecycle, and role scope unverified.                                                      | Media cannot be enabled.                                  | MED-01; manual core unaffected.                                                        |
| Blocking AI enablement   | Selected provider/model, retention, vision/JSON ability, Persian quality, connectivity, quota/cost unverified.                   | AI flags stay off.                                        | AI-01 evaluation; deterministic/manual fallback.                                       |
| Blocking deployed MVP    | Darkube networking, migrations, worker, probes, rollback and Supabase latency unverified.                                        | No deployment reliability claim.                          | OPS-01.                                                                                |
| Blocking public release  | Target countries/data region, processor terms, clinical/legal review, final visual/copy approval remain open in product gates.   | Educational build may exist but public launch is blocked. | REL-01; do not invent decisions.                                                       |
| Technical                | Owner predicate omission is critical because no custom RLS is planned.                                                           | Cross-account exposure.                                   | service conventions + QLT-01 real-DB adversarial suite.                                |
| Technical                | Timeline/concurrency complexity for plans, meals, jobs.                                                                          | Duplicates/stale overwrites.                              | DB constraints, idempotency/revisions/leases and race tests.                           |
| Privacy                  | Signed URLs and temporary images are secrets; cleanup may fail.                                                                  | Health-adjacent data leak/retention.                      | MED-02 narrow TTL, no logs, durable cleanup.                                           |
| Operational              | Supabase Free pause/quota/no guaranteed backups.                                                                                 | Downtime/data loss.                                       | honest limitations, export, restore exercise; no SLA claim.                            |
| Quality                  | Current local sandbox prevents child-process test/build completion.                                                              | Baseline execution is incomplete here.                    | rerun in GitHub CI or unrestricted Node environment before coding baseline acceptance. |
| Non-blocking assumption  | Core exports may be streamed synchronously if small; queue later without changing contract.                                      | Avoids worker dependency.                                 | ACC-01 measures size and preserves single-request semantics.                           |

There are no unresolved blocking product questions for starting FND-01 or building the manual core. The listed questions become blocking only at their affected gate.

## 13. Definition of Done

A task is done only when:

- Its acceptance criteria and spec references are met without broadening scope.
- Domain invariants live in pure/domain or owning service code, not UI/actions.
- Every owned operation is session-derived, owner-scoped, and adversarially tested.
- Schema changes use reviewed committed migrations and work on a fresh database.
- Persian and English keys are added with parity; RTL/LTR, logical CSS, dates/digits, `dir=auto`, and accessible names are verified.
- Loading, empty, error, cancellation, retry, offline, stale, and success states relevant to the task exist.
- Secrets/private URLs/health content are absent from client bundles and logs.
- Unit/integration/E2E tests appropriate to risk pass, followed by `npm run lint:all`, `npm test`, and `npm run build`; environment limitations are explicitly rerun elsewhere.
- Completion evidence includes changed-file list, migration/test evidence, screenshots/traces for UI, and documented residual risks.
- Source-of-truth docs and an ADR are updated only when an approved product/architecture decision actually changes.

Project completion additionally requires REL-01, fresh migration/deploy evidence, core bilingual E2E, account lifecycle/isolation proof, approved release catalog, and explicit disposition of every traceability row. Optional features may remain disabled without blocking core completion.

## 14. Recommended First Implementation Task

Start with **FND-01 — Verify and pin the supported baseline**. Identity is the first unimplemented trust boundary and every owner-scoped domain flow depends on it. A short, evidence-producing Better Auth/Prisma/Next compatibility gate prevents schema and UI work from being built around an unverified adapter while leaving all product decisions unchanged.
