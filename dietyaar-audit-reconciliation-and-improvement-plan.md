# Dietyaar audit reconciliation and improvement plan

## QLT-02 completion update — 2026-11-23

This update supersedes the older QLT-02/current-next-task statements below. Local pre-deployment quality hardening is now implemented: bilingual offline status and network-exception recovery, retained identity-form inputs, WCAG A/AA and contrast automation with `axe-core`, corrected primary/error contrast, 44px primary controls, reduced-motion assertions, keyboard/overflow checks, Core Web Vitals smoke budgets, confirmed-meal latency budget, and real local PostgreSQL outage/recovery evidence. The safe local half of `OPS-01` is also complete: a production Docker image builds, web/migration/optional-worker commands are separate, replicas do not migrate on startup, the 13-migration one-off job passes, web health and restart return HTTP 200, and the optional worker is fail-closed by default and starts as non-root when explicitly enabled.

Verification now includes 10/10 Chromium desktop/mobile quality cases and 5/5 Firefox cases on the local production build. The database health sequence was `200 healthy → 503 degraded → 200 healthy` across a controlled local PostgreSQL stop/restart, with no reset or data deletion. Unit tests remain 106/106 and the production build passes.

Mobile WebKit is configured in Playwright and CI now installs Chromium, Firefox, and WebKit. The WebKit binary could not be downloaded locally because every Playwright CDN mirror timed out, so no local WebKit pass is claimed. Likewise, the local LCP/INP/CLS and meal-save assertions are synthetic smoke gates, not p75 field evidence on a real mid-range mobile/4G population.

**Current development position:** P7 `OPS-01`, with its local image/command/migration/probe/worker rehearsal complete. The next incomplete roadmap work is the external portion of `OPS-01`: fresh Darkube/Supabase deployment, connectivity, secrets/probes/logs, gradual rollout, rollback, and best-effort export/restore/pause recovery evidence. Those actions remain gated by successful WebKit/CI evidence, representative performance evidence, production nutrition-source approval, owner decisions for legal/privacy/clinical/visual/public-demo policy, and explicit external authorization. No deployment or external platform operation was performed in this update.

## Final local pre-deployment update — 2026-11-22

This section supersedes all older implementation-status, current-phase, next-task, and verification statements below. The root `implementation-plan.md` was read in full and remains the previously approved execution-ready roadmap: seven phases, exactly 36 atomic task IDs, the same dependency chain, and task-level acceptance criteria. No revised roadmap was found.

The local implementation has now advanced through the manual deterministic product work and the non-provider portions of P5/P6 into P7 hardening. `NUT-01` now has a provider-neutral, versioned catalog boundary; owner-scoped user foods; frozen source/version snapshots on meal items; nullable nutrient aggregation; deterministic target alignment; and a guarded, idempotent 100-name bilingual development fixture. The fixture deliberately contains no invented nutrient values, is marked `DEVELOPMENT_FIXTURE`, accepts only local database hosts, and cannot be treated as an approved release catalog. A production nutrition release still requires an owner-approved source/license and reviewed Iranian-food coverage.

Structured plan schema v2 now supports meal slots and nutrient targets. Meal confirmation links to an owned applicable slot, clears explicit skip state, freezes nutrient provenance, and feeds Today/history summaries. Today and history distinguish known totals from unknown nutrients and distinguish completed, skipped, logged, partial, and unknown states without interpreting missing data as non-adherence. Owner-scoped user-food, plan, saved-meal, weight, job, account, media, and meal boundaries have real PostgreSQL adversarial coverage.

Current verification evidence:

- `npm test`: 12 files and 106 tests passed.
- `npm run test:integration`: 6 files and 11 tests passed against `localhost:5433/dietyaar_test`; all 13 committed migrations are current.
- Manual-core Playwright: 4/4 passed on the local production build (Persian/English × desktop/mobile), covering registration, recovery-code acknowledgement, onboarding, structured plan creation, slot-linked meal confirmation, Today rendering, RTL/LTR, viewport overflow, and keyboard focus.
- ESLint, RTL smoke check, TypeScript, and targeted formatting passed.
- `npm run build`: Next.js 16.4.6 production build passed and generated the expected product and API routes.
- `npm run lint:all` reaches only the repository-wide Prettier check and reports the pre-existing untracked `dietyaar-comprehensive-audit.md`; it was intentionally not reformatted as part of application work.

The integration harness had a safety defect: it validated and assigned `TEST_DATABASE_URL` to runtime `DATABASE_URL` but left Prisma CLI `DIRECT_URL` inherited. During one verification run, Prisma therefore applied pending committed migrations to the Supabase URL already present in the developer environment. No application rows, storage objects, AI provider, Darkube resource, or deployment was intentionally created, but this schema change is an external modification and must not be hidden. The harness now pins both `DATABASE_URL` and `DIRECT_URL` to the validated local/test URL, and the corrected rerun explicitly reported `localhost:5433/dietyaar_test`. No rollback was attempted because an external destructive schema change requires separate authorization and backup/context review.

**Current development position:** P7 hardening. `QLT-01` has substantial security/ownership evidence and the critical bilingual browser campaign of `QLT-02` is passing. Remaining pre-release evidence includes broader accessibility/contrast checks, failure-injection and performance budgets. The next roadmap heading after those gates is `OPS-01`, which includes Docker/migration/deployment/recovery rehearsal and needs explicit external authorization. Per the user's instruction, no deployment step was started.

Detailed current evidence and remaining gates are recorded in `docs/engineering/pre-deployment-verification.md`.

## Status addendum — 2026-11-22

This addendum supersedes the implementation-status, verification, current-phase, and next-task statements in the 2026-11-21 point-in-time audit below. The original audit narrative is retained as historical reconciliation evidence.

The requested local P4 domain-completion package is now implemented: immutable plan replacement cloning and bounded historical correction, optimistic confirmed-meal revision history, owner-bound delete/10-second undo, saved-meal rename/delete/reuse, explicit day complete/reopen and slot-state services, opt-in weight history, revision-aware deterministic reflections and feedback, complete profile/preferences/consent/weight settings, bilingual legal surfaces, owner-only JSON export, and password-reauthenticated immediate account deletion.

The requested P5/P6 local boundary and disabled-by-default infrastructure is also implemented. Private media has owner/purpose/consent checks, unguessable object paths, signed upload/download contracts, size/MIME/magic-byte verification, SHA-256 metadata, seven-day expiry, deletion states, and adversarial fake-adapter tests. PostgreSQL jobs have idempotent enqueue, atomic `SKIP LOCKED` claim, leases, recovery, retry/backoff, cancellation, safe errors, and a separate worker entrypoint. AI has provider-neutral interfaces, strict versioned schemas, quota/consent/feature/revision gates, cancellation on consent withdrawal, safe error taxonomy, stale-result rejection, and deterministic/manual fallback. All media, worker, and AI flags remain off by default.

No Supabase, Darkube, deployment, or live AI-provider resource was created, modified, or contacted. Consequently, `MED-01` vendor verification and live-provider enablement are deliberately **not claimed**; they remain release/enablement gates rather than gaps in the local private boundary. Image/AI entry points remain hidden while disabled, and the manual product paths remain available.

Current verification evidence:

- `npm test`: 10 files and 95 tests passed.
- `npm run test:integration`: 4 files and 9 tests passed against the isolated Docker test database; all 12 committed migrations applied.
- ESLint, RTL smoke check, and TypeScript passed.
- `npm run build`: Next.js 16.4.6 production build passed and generated all product/API routes.
- `npm run lint:all` reaches only the Prettier check and reports the pre-existing untracked `dietyaar-comprehensive-audit.md`; that unrelated user document was intentionally not reformatted.

Updated finding mapping: `F-002`, `F-006`, and `F-010` now have local implementation and adversarial lifecycle evidence; `F-011` now has the private media/job/AI boundary but remains disabled pending external verification; `F-012` is resolved for unit, integration, and production-build execution. The strict roadmap still cannot claim every P1–P6 exit gate because `NUT-01` (sourced nutrition catalog/provenance), full structured plan-slot/adherence UX, and the broader bilingual browser/accessibility campaign remain incomplete.

**Current development position:** requested P4 and local P5/P6 infrastructure work is complete; the repository is in pre-P7 hardening, but not deploy-ready. **Next incomplete task by dependency and release risk:** finish `NUT-01` and structured deterministic adherence/slot UX evidence, then execute `QLT-01`, `QLT-02`, and only afterward the non-deploy portions of `OPS-01`/`REL-01`. Live `MED-01`, provider enablement, and every deploy step require separate authorization.

**Date:** 2026-11-21  
**Scope:** Current working tree and safe local verification only. No application code, configuration, database, migrations, accounts, external services, or deployment were changed.  
**Authority:** `docs/engineering/technical-spec.md` §1.2 governs conflicts. The visual-design document is alpha and was not treated as final approval.

## 1. Executive summary

Dietyaar has a sound technical foundation and an in-progress authenticated demo/manual-meal slice. It is **not yet a release-ready MVP**. The owner report that every button is nonfunctional is not accurate: navigation, locale links, password visibility, sign-out, and several authenticated manual-core operations are implemented in source. It is nevertheless understandable: most screen-labelled journeys are still demonstrative, visually similar, and lack the product operation their labels imply.

The most material current gap is the missing end-to-end manual value loop: a user can create and confirm a single unplanned manual meal draft in the current working tree, but cannot create/activate a complete plan, calculate explainable adherence, close/reopen a day, edit/delete a meal, or use history. Account registration/recovery, privacy lifecycle, consent, AI/media, and most settings are also absent.

There are three verified implementation problems/risk items requiring near-term work: (1) the public demo is coupled to a fixed credential and no deployment guard is visible; (2) the active demo shell embeds product UI text rather than using `next-intl` dictionaries; (3) the new manual meal slice has no dedicated service/integration/adversarial authorization tests. The earlier audit's claimed migration-test mismatch is no longer valid: the current integration expectation lists all four committed migrations.

## 2. Method, limits, and repository state

- Read `AGENTS.md`, source-of-truth specifications, ADRs, engineering notes, installed Next.js App Router guides (layouts/pages, navigation, client/server components, server functions, and route handlers), source, migrations, tests, configuration, and recent Git history.
- The root-level `implementation-plan.md` is present (67,101 bytes; dated 2026-11-16). It is the execution-ready, previously approved seven-phase plan: P1–P7 and exactly 36 atomic tasks with objectives, dependencies, acceptance criteria, validation evidence, risks, a critical path, traceability matrix, and definition of done. The earlier statement that it was absent was incorrect.
- `docs/dietyaar-comprehensive-audit.md` is also absent; `dietyaar-comprehensive-audit.md` exists at the repository root as an untracked file. It was reconciled as working-tree evidence, not approved documentation.
- The tree contains unrelated/in-progress user changes, including auth/demo/manual-core migrations and `docs/app-walkthrough.html`. They were preserved.
- Live local testing was blocked before a server could start: `npm run dev` failed with Windows `spawn EPERM`. No control is reported as browser-clicked unless stated below. No account was seeded because that would violate this planning-only scope.

## 3. Actual implementation status

| Area                                | Actual status                             | Evidence                                                                                       |
| ----------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| App shell/locales                   | Partial foundation                        | `/fa` and `/en`, `next-intl` routing/layout direction; local UI primitives and RTL smoke check |
| Identity                            | Partial                                   | Better Auth Prisma adapter and username plugin; demo sign-in only; `disableSignUp: true`       |
| Demo                                | Functional presentation shell             | 33 labelled demo screens; menu, route navigation, locale link and sign-out client handlers     |
| Onboarding                          | Partial persistence, not product-complete | `Profile` and save-progress action only; the displayed radio choices have no stored meaning    |
| Manual meal                         | Partial vertical slice                    | owner-scoped draft creation, draft item persistence, confirmation transaction, Today list      |
| Plan/adherence                      | Not implemented                           | only `PlanDraft` shell; no plan version/slots/activation/calculation                           |
| History/weight/reflections/settings | Demo-only                                 | static cards/views; no operations or models for most requirements                              |
| Export/deletion/consent/retention   | Not implemented                           | no services/routes/models beyond cascades                                                      |
| Media/worker/AI                     | Configuration guard only                  | flags default off; no provider adapter, jobs, storage flow, consent record, or AI call         |

Implementation phase: **P1/P2 transition, with partial P3 prototype work**. FND-01 through FND-03 have substantial documented/current evidence; FND-04 is only partially complete. IDN-01, ONB-01/02, PLN-01, MEL-01/02, and UI-01 have partial working-tree evidence but none meet their plan acceptance criteria. No phase exit gate is complete, so the product must not be represented as having reached P2 or P3.

### Plan verification and roadmap comparison

The recovered file is the previously approved roadmap, not a different or revised plan: it says it was prepared from a 2026-11-16 repository inspection, identifies seven phases and exactly 36 task headings, and its structure matches the historical audit's references to a seven-phase/36-task plan. No later roadmap revision was found.

Its 36 tasks are: P1 `FND-01`–`FND-04` (4); P2 `IDN-01`–`IDN-03`, `ONB-01`–`ONB-02` (5); P3 `PLN-01`–`PLN-02`, `NUT-01`, `MEL-01`–`MEL-02`, `DAY-01`, `UI-01` (7); P4 `PLN-03`, `MEL-03`–`MEL-04`, `WGT-01`, `REF-01`, `SET-01`, `ACC-01`–`ACC-02` (8); P5 `MED-01`–`MED-03` (3); P6 `JOB-01`, `AI-01`–`AI-04` (5); P7 `QLT-01`–`QLT-02`, `OPS-01`, `REL-01` (4).

The only difference is between the plan's dated baseline and the current uncommitted implementation: the plan correctly recorded no product models, identity handler, services, actions, or feature routes at 2026-11-16; the present working tree adds partial Better Auth, profile/meal persistence, demo routes, and migrations. The plan has not been revised to mark those tasks complete, and the new work does not satisfy their defined acceptance criteria.

**Next incomplete task in strict plan order: `FND-04 — Build the bilingual application shell and test matrix`.** Locale shells and responsive demo navigation exist, but dictionary parity, error/loading/offline boundaries, accessible/mobile evidence, and a passing full gate are not established. Then complete `IDN-01`, rather than skipping to P3: its public registration, `IdentityService` boundary, generic auth UX, and acceptance tests are still absent.

## 4. Reconciliation of F-001 to F-015

The task mapping below is against the recovered root `implementation-plan.md`. Status means current evidence against that task's acceptance criteria—not merely the presence of similarly named files.

| Finding                                    | Current classification                | Evidence now                                                                                                                     | Existing task mapping / required clarification                                                                | Release impact                                    |
| ------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| F-001 core implementation absent           | Existing task requires clarification  | Meal services/actions, `MealDraft`, `MealDraftItem`, `Meal`, and `DayState` now exist; plans/adherence remain absent             | P3; clarify its acceptance criteria to distinguish a one-item manual slice from the complete core loop        | Blocks MVP/release                                |
| F-002 privacy lifecycle absent             | Existing task already covers it       | no export/deletion/consent/retention implementation                                                                              | P4/P7; add explicit destructive-operation and partial-failure acceptance tests                                | Blocks public release                             |
| F-003 account lifecycle absent             | Existing task already covers it       | sign-up disabled; no public registration/recovery UI or service                                                                  | P2; reconcile public username/recovery technical decision with implementation                                 | Blocks MVP onboarding                             |
| F-004 demo may imply a product             | Immediate corrective action required  | demo labels cover broad product scope; some views now persist data despite text saying demo does not save real data              | P3; clearly label “interactive prototype with limited persisted sample data” and separate demo/product routes | Blocks stakeholder acceptance, not code execution |
| F-005 meal/adherence missing               | Existing task requires clarification  | manual draft/confirm exists; no catalog, plan matching, completeness, totals beyond known energy, adherence, edit/delete/history | P3/P4; define testable calculation and unknown-value criteria                                                 | Blocks core value                                 |
| F-006 isolation risk                       | Existing task requires clarification  | current draft lookup/update predicates include `userId`; no two-account tests                                                    | P3/P7; add adversarial tests for create/confirm/list and every future lookup                                  | Blocks release evidence                           |
| F-007 fixed demo credentials               | Immediate corrective action required  | `DemoLogin` pre-fills and seed script contains known credentials; no public/deployment guard found                               | P2/P7; prohibit seed/demo route in production and use isolated synthetic-only environment                     | Blocks any public demo deployment                 |
| F-008 migration mismatch                   | No longer applicable                  | integration test now expects foundation, Better Auth, manual core, and meal-draft-item migrations                                | No action; run isolated integration suite to verify                                                           | Not a current blocker                             |
| F-009 localization consistency             | Existing task already covers it       | demo copy remains hard-coded in `DemoLogin`, `DemoShell`, `demo-screens`; dictionaries are not its source                        | P3/P7; require dictionary parity and locale E2E per feature                                                   | Blocks bilingual release                          |
| F-010 supporting domains missing           | Existing task already covers it       | profile is minimal; weights/settings/export/delete unavailable                                                                   | P4                                                                                                            | Future milestone, export/delete blocks release    |
| F-011 AI/media absent                      | Intentionally deferred                | feature flags/config validation exist; no implementation                                                                         | P5/P6; cannot start before P3 passes                                                                          | Not a manual-slice blocker                        |
| F-012 verification limitation              | Existing task requires clarification  | tests/dev/build validation fail before workers spawn with `EPERM`; compile/typecheck pass                                        | P1/P7; CI/unrestricted evidence is required                                                                   | Blocks verification, not proof of product defect  |
| F-013 accessibility/mobile evidence absent | Existing task already covers it       | labels and logical utilities exist; no executable browser journey evidence                                                       | P7; add keyboard, focus, responsive, contrast and reduced-motion acceptance tests                             | Blocks accessibility claim/release evidence       |
| F-014 dual localization paths              | Existing task requires clarification  | legacy `lib/locale`, `lib/t`, legacy messages coexist with `next-intl`                                                           | P3; decide migration/removal boundary before more product copy                                                | Maintenance risk                                  |
| F-015 health detail                        | Intentionally deferred / owner policy | unauthenticated health endpoint returns health/database status only                                                              | P7; choose ingress/probe restriction before production                                                        | Low release hardening item                        |

### Exact finding-to-task mapping

This table supersedes the phase-only abbreviations in the preceding reconciliation table.

| Finding | Plan task IDs                                                       | Reconciled task status / acceptance gap                                                                                                       |
| ------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| F-001   | `PLN-01/02`, `NUT-01`, `MEL-01/02`, `DAY-01`, `UI-01`               | Only partial `MEL-01/02` scaffolding exists; the plan/food/day/UI acceptance criteria are unmet.                                              |
| F-002   | `SET-01`, `ACC-01/02`, `MED-02`, `JOB-01`, `QLT-01`, `REL-01`       | Not started.                                                                                                                                  |
| F-003   | `IDN-01/02/03`, `ONB-02`                                            | Better Auth handler is partial `IDN-01`; public registration, throttling, recovery and their acceptance evidence are absent.                  |
| F-004   | `FND-04`, `UI-01`, `REL-01`                                         | Existing tasks cover product shell/release traceability; add explicit demo/prototype disclosure and route-boundary criteria.                  |
| F-005   | `NUT-01`, `MEL-01/02`, `DAY-01`, `UI-01`, `MEL-03/04`               | Partial meal persistence does not satisfy the planned catalog, deterministic review, idempotency, alignment, correction, or history criteria. |
| F-006   | `ONB-01`, `PLN-01`, `NUT-01`, `MEL-01/02`, `QLT-01`                 | Current meal predicates are owner-scoped, but mandatory real-DB two-user coverage is absent.                                                  |
| F-007   | `FND-03`, `IDN-01`, `OPS-01`, `REL-01`                              | Plan needs an explicit production/demo-seed isolation acceptance criterion; no new roadmap task is necessary.                                 |
| F-008   | `FND-02`                                                            | No longer applicable: migration expectation now names all four migrations. Fresh isolated evidence remains required.                          |
| F-009   | `FND-04`, `ONB-02`, `PLN-02`, `MEL-01`, `UI-01`, `SET-01`, `QLT-02` | Existing plan explicitly requires dictionaries/parity and bilingual E2E; current hard-coded demo copy fails that direction.                   |
| F-010   | `ONB-01/02`, `WGT-01`, `REF-01`, `SET-01`, `ACC-01/02`              | Not started beyond minimal profile step persistence.                                                                                          |
| F-011   | `MED-01/02/03`, `JOB-01`, `AI-01/02/03/04`                          | Intentionally deferred until manual slice; disabled configuration is appropriate.                                                             |
| F-012   | `FND-01/02/04`, `QLT-02`, `REL-01`                                  | Environment restriction prevents evidence, not a failed product assertion.                                                                    |
| F-013   | `FND-04`, `ONB-02`, `UI-01`, `QLT-02`                               | Foundation aids accessibility; required journey evidence is absent.                                                                           |
| F-014   | `FND-04`, `QLT-02`                                                  | The plan's replace/remove analysis already calls for legacy-message retirement once migration is complete.                                    |
| F-015   | `FND-03`, `OPS-01`, `REL-01`                                        | Existing hardening/release tasks cover the production probe policy decision.                                                                  |

## 5. Route and interaction inventory

### Routes

| Route                       | Actual status                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `/fa`, `/en`                | Demo login landing page, not registration/auth product                                    |
| `/[locale]/demo/A01`, `A02` | static/auth-labelled demo views after authenticated session                               |
| `/[locale]/demo/O01`–`O09`  | demo onboarding; Continue persists only a numeric `Profile.onboardingStep`                |
| `/[locale]/demo/T01`        | partially live Today: lists confirmed meals for the session owner and sums known energy   |
| `/[locale]/demo/M01`–`M05`  | M01–M03 support create-review-confirm one manual item; M04–M05 remain presentation routes |
| `/[locale]/demo/H01`–`H04`  | static history views                                                                      |
| `/[locale]/demo/P01`–`P04`  | static plan views                                                                         |
| `/[locale]/demo/S01`–`S07`  | static settings/privacy views                                                             |
| `/[locale]/demo/L01`        | static legal demo                                                                         |
| `/api/auth/[...all]`        | Better Auth handler                                                                       |
| `/api/health`               | public dynamic health probe                                                               |

### Control-by-control result

| Controls / screens                       | Promise                                   | Actual source-level result                                                                       | Classification                                             |
| ---------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Landing username/password form           | enter demo                                | calls Better Auth username sign-in, then routes to T01 on success; bad credential displays alert | Implemented but browser-unverified                         |
| Password eye                             | show/hide password                        | local state changes input type                                                                   | Implemented but browser-unverified                         |
| Demo sidebar, previous/next, locale link | navigate/locale                           | client/Next links navigate; locale link changes pathname but no persisted preference             | Implemented navigation; locale persistence not implemented |
| Mobile menu/open-close/overlay           | expose navigation                         | local `open` state; no focus-management proof                                                    | Implemented but browser-unverified accessibility           |
| Sign out                                 | exit demo                                 | Better Auth sign-out then landing route                                                          | Implemented but browser-unverified                         |
| O01–O09 radios                           | choose onboarding path                    | native controls change only local browser state; no meaning reaches action                       | Intentionally static demo                                  |
| O01–O09 Continue                         | advance/save onboarding                   | saves only next step and locale to the authenticated profile, then navigates                     | Partially implemented; wording is misleading               |
| T01 Log meal                             | start logging                             | navigates to M01                                                                                 | Verified by source, browser-unverified                     |
| M01 manual entry                         | select manual path                        | routes M02                                                                                       | Implemented navigation                                     |
| M02 food, grams, energy form             | create draft                              | Zod validates then creates one owner-scoped unplanned draft item; errors are not rendered in UI  | Partially implemented                                      |
| M03 confirm                              | add consumption to Today                  | atomically owner-claims draft, creates confirmed meal/items, reopens day state, routes T01       | Partially implemented; browser-unverified                  |
| M03 Back                                 | correction                                | only returns to M02; does not load/edit the draft                                                | Verified nonfunctional relative to promise                 |
| M04/M05 controls                         | logging/reuse/correction                  | generic/sampled view navigation only                                                             | Intentionally static demo                                  |
| H01–H04                                  | history/progress/weight                   | static sample metrics and progress bars                                                          | Intentionally static demo                                  |
| P01–P04 View version                     | plan creation/edit/activation             | advances demo screen only                                                                        | Intentionally static demo                                  |
| S01–S07 cards                            | profile/preferences/privacy/export/delete | cards are not interactive                                                                        | Verified nonfunctional relative to screen labels           |
| L01 Continue                             | legal flow                                | advances demo screen only                                                                        | Intentionally static demo                                  |

Reproduction evidence: inspect `DemoLogin.tsx`, `DemoShell.tsx`, `manual-core.ts`, `meal-service.ts`, and the route page. Browser reproduction could not be completed because `next dev` exits with `spawn EPERM`; no click claim is made.

## 6. Navigation, visual similarity, and demo terminology

The sidebar groups are understandable, current route highlighting is clear, and the responsive drawer is an appropriate presentation pattern. The screens feel repetitive because many IDs share `GenericView`, the same card template, a persistent sample-data tag, and “Continue demo journey.” This is expected for a walkthrough scaffold but unsuitable as a product review substitute.

Specific changes to plan before implementation (not made here):

- Keep a persistent `Demo / نمونه نمایشی` banner that says which operations use synthetic persistence and which are illustrative; do not say “does not save real data” on O01–O09 while the Continue control does save a profile value.
- Rename `نسخه دمو` to `نمایش نمونهٔ محصول` and `گزینه پیشنهادی` to `گزینه نمونه` unless it is actually generated from user data. Make the primary action state the real outcome: “ثبت پیش‌نویس وعده” then “تأیید و افزودن به امروز.”
- In the eventual product, replace the catalogue sidebar with a small mobile-first primary navigation: Today, Log meal, Plan, History, Settings. Onboarding should be linear with a visible step count, not a global catalogue.
- Give each real screen a distinct job and state: method selection, food/portion form, review-and-confirm, Today feedback, and history should not share the generic card.

## 7. Product and UX assessment

The manual meal path needs at least: select/add foods, portions and units; unknown nutrient display; review; explicit confirmation; edit/delete/undo; planned/unplanned distinction; complete-day confirmation; deterministic comparison that does not turn missing logs into non-adherence. The current route takes a minimum of four navigation/actions (Today → M01 → M02 → M03 → confirm) for one item, so “fast logging” cannot be claimed. No task time was measured.

Morning reflection is only fixed sample copy. It is not currently positioned as an interrupt, nor does it have an acknowledgment behavior; 08:00/timezone behavior is not implemented. The correct future rule remains an in-app card at the selected local time, with no AI dependency and no obstruction of logging.

Food units need a formal catalog/input contract: canonical grams and kcal, a display unit/value, and a bounded description for non-measurable household portions. Use synthetic or sourced values with provenance; never label fixture nutrition as clinical authority.

## 8. Visual, localization, and accessibility review

Foundation strengths: logical `start/end`/`ms` utilities, directional arrows, labels on the login form, named icon buttons, responsive drawer, runtime `lang`/`dir`, and Persian free-text `dir="auto"` in meal display.

Gaps: demo strings bypass locale dictionaries; locale switch is a path switch only; product-specific Jalali/Gregorian and numeral journeys are unavailable; form validation/server errors are not presented; no user-visible loading/error/empty/success/destructive states for real product journeys; M02 uses a numeric form but has no unit-selector/format-normalization UI. WCAG 2.2 AA cannot be claimed without keyboard, focus order/return, contrast, target-size, screen-reader, reduced-motion, and both-direction browser checks.

## 9. AI integration status

No AI provider is implemented or invoked. `.env` names provider-related settings but values were not read or exposed. `.env.example` defaults storage, worker, and all three AI flags to `false`; schema validation requires a worker/provider, and private storage for image features, when enabled. There are no provider adapters, route/service call sites, timeouts, retries, request/response schemas, consent records, quotas, job leases, or AI tests.

| Capability                    | Status                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Plan-image extraction         | Not implemented; disabled by default                                                 |
| Meal-photo recognition        | Not implemented; disabled by default                                                 |
| AI-written reflection         | Not implemented; disabled by default                                                 |
| Deterministic manual fallback | Partially supported by configuration; complete manual product flow not yet available |

Do not enable or live-test any provider without explicit authorization, a selected provider/model, consent implementation, quotas, and a mocked test suite.

## 10. Required deterministic development fixtures

Provision only in a disposable local database later. Use Better Auth’s supported sign-up/identity boundary, synthetic `.invalid` email internals where the adapter requires one, and application operations rather than direct auth-table inserts.

| Entity    | Required fixture data                                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users     | `dev-sara`, `dev-reza`, and a third no-plan user; unique synthetic username/recovery credentials; no real PII                                                                                           |
| Profiles  | Persian/metric/Asia-Tehran and English/imperial variants; all/some/none optional profile attributes; tracking on/off                                                                                    |
| Plans     | one active version with breakfast/snack/lunch/dinner slots, alternatives, dates, plan author metadata, and explicit synthetic/source-labelled nutrition                                                 |
| Foods     | Iran-first examples (e.g. sangak, feta, walnut, lentil rice, grilled chicken, mast-o-khiar, apple) with portion labels, canonical grams, nullable nutrients, provenance and fixture-not-clinical marker |
| Meals     | drafts, confirmed planned/unplanned meals, one deleted/corrected record, explicit skip, and an unknown-nutrients item                                                                                   |
| Day state | complete, partial, reopened, skipped-slot and no-log dates; never infer missing as failure                                                                                                              |
| Weight    | explicitly opted-in user with entries; one profile-weight-only user with no `WeightEntry`                                                                                                               |

Fixture design: version the fixture data; make it idempotent; assert a local/test database name/host before execution; use stable IDs/dates; give every fixture an owner; provide non-destructive cleanup by fixture namespace; never point it at production or public demo infrastructure.

## 11. Test-account scenarios

| Scenario                | Preconditions/data                    | User action and expected outcome                                               | Feasibility / tests / phase                                   |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| A Fully logged          | active plan, all slots                | confirm each meal, close day; completeness true but alignment remains separate | Not yet feasible; P3/P4 service + E2E                         |
| B Perfect adherence     | plan and matching values              | confirm matching meals; explain deterministic alignment                        | Not feasible; P3 calculation tests                            |
| C Partial adherence     | some matches/deviations               | confirm; show qualified partial comparison                                     | Not feasible; P3/P4                                           |
| D Significant deviation | unplanned high/unknown meals          | confirm; explain neutrally, no judgment                                        | partially can create unplanned item; comparison unavailable   |
| E Missing logs          | expected slots, no records            | dashboard remains unknown/partial, never “failed”                              | Not feasible; P4                                              |
| F Skipped meals         | explicit skip record                  | distinguish skipped from unreported                                            | Not feasible; P4                                              |
| G Edited entries        | confirmed record/draft                | edit/recalculate auditably, preserve revision/undo semantics                   | Not feasible; P4                                              |
| H Weight tracking       | tracking-on and tracking-off profiles | add explicit entry only for opted-in user; profile weight creates none         | Not feasible; P4                                              |
| I Localization          | same fixture under `/fa`/`/en`        | check RTL/LTR, digits, date calendar labels, free text                         | shell feasible; product journey not feasible; P3/P7           |
| J Isolation             | Sara/Reza owned plans/logs            | attempt each read/update/confirm with other ID; deny/no disclosure             | partial source predicates present; no executable tests; P3/P7 |

## 12. Security, QA, and infrastructure

Positive evidence: server env validation, no public secret names in example config, default-off external features, CSP/header baseline, forward migrations, owner predicates in `confirmMealDraft`, and cascades. Risks: known demo credential; no proof that demo tooling is unavailable in production; missing registration/recovery throttling; no account deletion/export; no consent lifecycle; no owned-operation test suite; and no live deployment/storage/provider verification.

| Command            | Result in this review                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint:all` | TypeScript, ESLint, RTL smoke passed; overall command failed because existing untracked `dietyaar-comprehensive-audit.md` is not Prettier-formatted |
| `npm test`         | blocked: Vitest could not create any fork worker (`spawn EPERM`); zero tests executed                                                               |
| `npm run build`    | Turbopack compilation passed; final TypeScript worker could not spawn (`spawn EPERM`)                                                               |
| `npm run dev`      | blocked before local server startup with the same `spawn EPERM`                                                                                     |
| Integration/E2E    | not run: needs allowed isolated database/server and, for authenticated flow, a seeded synthetic account                                             |

The worker failures are execution-environment limitations, not passing verification and not proof of application test failures. CI or an unrestricted workstation must provide clean evidence. The existing `scripts/test-supabase-connections.mjs` writes/deletes a probe and was deliberately not run.

## 13. Static HTML walkthrough recommendation

An HTML walkthrough is useful for stakeholder review only if it is explicitly labelled illustrative. `docs/app-walkthrough.html` already exists but was not treated as proof of functionality. A review version should cover: welcome/login distinction; optional-profile onboarding; manual plan/activation; empty/partial/complete Today; meal method/form/review/confirmed/error; history; settings/privacy/export/delete confirmation; Persian RTL and English LTR; loading/error/empty/success states. It must carry a persistent “illustrative—does not create product data” marker and link each screen to its implementation status.

## 14. Prioritized improvement backlog

| ID    | Action and evidence                                                                                                           | Mapping/dependencies                          | Priority / approval                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| AR-01 | Complete `FND-04`: parity, route-equivalent locale switching, state boundaries, accessible/mobile test matrix, and evidence   | current next incomplete planned task          | P0                                                   |
| AR-02 | Isolate/remove public demo credential path; production guard, synthetic-only environment, no real data                        | F-007; auth/deployment configuration          | P0; approval needed for public-demo policy           |
| AR-03 | Complete `IDN-01/02/03`, then `ONB-01/02` and the planned P3 chain using its existing acceptance criteria                     | F-001/F-003/F-005; services/domain/migrations | P0                                                   |
| AR-04 | Add owner-isolation unit/integration tests for current meal/profile operations before more writes                             | F-006; isolated DB harness                    | P0                                                   |
| AR-05 | Correct demo disclosure and split illustrative controls from persistent prototype controls                                    | F-004; product copy decision                  | P1                                                   |
| AR-06 | Move demo/product copy to `next-intl` dictionaries, enforce parity, retire/fence legacy localization                          | F-009/F-014                                   | P1; migration decision required                      |
| AR-07 | Complete manual-meal corrections, delete/undo, plans, known/unknown aggregation, explicit day complete/reopen, history        | F-005; AR-03                                  | P1                                                   |
| AR-08 | Implement profile/settings/weight/consent/export/deletion lifecycle with owner scope and failure handling                     | F-002/F-010                                   | P1/P2; deletion behavior already governed by ADR-013 |
| AR-09 | Create deterministic local fixture module and scenario tests; never seed public or production DB                              | scenarios A–J                                 | P1; fixture values/provenance approval               |
| AR-10 | Add bilingual keyboard/mobile/accessibility E2E and run CI/unrestricted verification                                          | F-012/F-013                                   | P2                                                   |
| AR-11 | Implement private media/worker/provider adapter only after manual slice passes; mocked failures, consent, quotas, kill switch | F-011                                         | P3; provider/model and budget approval needed        |
| AR-12 | Decide production health-probe exposure/ingress policy and complete deployment evidence                                       | F-015                                         | P3; owner/ops approval                               |

## 15. Immediate and future blockers

**Immediate:** incomplete P1 `FND-04`; no supported account lifecycle; no active-plan/adherence loop; no runnable local verification in this restricted environment; no proof of demo credential isolation; missing cross-account tests.

**Future/release:** export/deletion/consent, full bilingual/accessibility evidence, media/AI gates, deployment/Supabase/Darkube verification, backup/recovery exercise, and formal performance measurements.

## 16. Owner decisions and recommended next task

**Correction:** the root-level `implementation-plan.md` is the approved plan; it does not need to be recreated or relocated. The actual next incomplete task is `FND-04 — Build the bilingual application shell and test matrix`, followed by `IDN-01`. Do not treat partial uncommitted prototype work as task completion. After identity/onboarding, follow the existing P3 critical path: `PLN-01/02` plus `NUT-01`, then `MEL-01/02`, `DAY-01`, and `UI-01`.

Please decide: (1) whether the demo may ever be publicly reachable and, if so, its isolation policy; (2) whether the partial persisted demo should remain a prototype route or move behind a clearly separate development-only boundary; (3) fixture nutrition source/provenance and provider selection/cost approval before AI work.

**Recommended next implementation task:** AR-01 followed immediately by AR-03/AR-04: recover the authoritative task plan, then finish and test the owner-scoped manual vertical slice (real identity lifecycle → plan activation → manual meal draft/review/confirmation → Today/completeness/alignment). Do not begin AI or public demo deployment first.
