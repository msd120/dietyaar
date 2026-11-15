# Dietyaar — Technical Specification

Version: 1.0-draft  
Date: 2026-11-15  
Status: Implementation-ready baseline for an educational MVP; external capabilities marked **Requires Verification** remain non-final  
Audience: project owner, developers, reviewers, and AI coding agents

## Executive summary

Dietyaar is a Persian-first, bilingual, mobile-first diet-progress companion. This specification converts [product-spec.md](./product-spec.md) and [design-scope.md](./design-scope.md) into an implementation blueprint while recording later owner-approved clarifications without modifying those source documents.

The application is a modular monolith based on `mhp-nextjs-boilerplate`: Next.js App Router, React, TypeScript, Tailwind, locally owned shadcn/Radix primitives, Zod, Prisma, PostgreSQL, Vitest, Playwright, Docker, and GitHub Actions. The boilerplate's service-layer and lint-enforced boundaries are retained. Its single-locale model, username/password implementation, admin-oriented user model, and single-process deployment assumptions are replaced or extended.

The educational MVP uses Darkube for the web container and an optional worker, Supabase Free for PostgreSQL and private object storage, Better Auth as the preferred embedded authentication candidate, and a bundled versioned nutrition catalog. The core product must work without AI credentials: manual plan entry, structured meal logging, deterministic calculations, and deterministic in-app reflections are mandatory. Plan-image extraction, meal-photo recognition, and AI-written reflections remain present but feature-flagged.

The design optimizes for learning, near-zero infrastructure cost, and safe fundamentals rather than production-grade availability. Supabase Free has no guaranteed backups or PITR and may pause inactive projects; recovery is best effort. Production hardening is listed separately.

### Revision history

| Version   | Date       | Change                                                                                                                                                                                                                  |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0-draft | 2026-11-15 | Initial implementation-ready educational-MVP baseline assembled from product/design sources and owner clarifications.                                                                                                   |
| 1.1-draft | 2026-11-15 | Specification audit: expanded logical database contracts, module boundaries, execution paths, security/job/AI contracts, capacity assumptions, dependency inventory, and release evidence. No product decision changed. |

Document changes require a pull request. A change that alters product behavior, privacy, cost, provider commitment, data retention, or an approved ADR requires owner approval. Pure clarification that preserves behavior may be reviewed as an engineering change. When source documents disagree, section 1 governs and the conflict must remain visible until the source is separately updated.

## 1. Authority, classifications, and conflict resolutions

### 1.1 Source precedence

1. Explicit owner decisions recorded in this specification.
2. `product-spec.md` for product policy, calculations, and acceptance behavior.
3. `design-scope.md` for pages, states, and journeys.
4. Approved `design.md` or Figma for visual implementation; until available, neutral accessible tokens are permitted.
5. Boilerplate conventions where they do not conflict with the above.

Decision labels:

- **Confirmed** — explicitly approved product or owner decision.
- **Recommended** — implementation choice to validate during initialization.
- **Requires Owner Decision** — no remaining blocking items at publication; new material changes use this label.
- **Requires Verification** — depends on an external platform, provider, live account, or technical spike.

### 1.2 Approved overrides of existing sources

The following are intentional clarifications. Do not silently “correct” them back to the older source wording.

| Source statement                                     | Approved technical baseline                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Email OTP authentication                             | Open public registration with unique username and password; no email/phone, email verification, or email reset. Better Auth is preferred, subject to verification. |
| Account recovery via email                           | Username plus a hashed, single-use user-held recovery code. Losing password and code makes recovery impossible.                                                    |
| AI plan extraction and AI reflection required/active | Optional feature-flagged enhancements; manual plan entry and deterministic reflections define core completion.                                                     |
| Product v1.2 requires meal-photo recognition         | Preserved in architecture and UX but optional and feature-flagged for the educational MVP.                                                                         |
| Optional web push                                    | Deferred. No service worker, permission prompt, push subscription, or background notification delivery.                                                            |
| Proposed 24-hour RPO/RTO                             | Best-effort only while using Supabase Free. Do not represent a guarantee.                                                                                          |
| Account deletion may queue/finish within seven days  | Immediate, irreversible application-data deletion after password reauthentication; storage cleanup may retry.                                                      |
| Retained plan source images may be supported         | Images are temporary and deleted after successful plan activation; abandoned media expires after seven days.                                                       |

Authentication pages and journeys A01/A02/J01 must be implemented with equivalent username/password registration, login, and recovery-code screens rather than email-code controls. Push-specific states are future design references, not active MVP surfaces.

## 2. Scope and non-goals

### 2.1 Essential educational MVP

- Public username/password registration, login, logout, sessions, recovery codes, and immediate account deletion.
- Resumable onboarding, adult eligibility, consent, locale, timezone, goal, and optional weight tracking.
- Manual structured diet-plan entry, review, activation, immutable versions, replacements, and historical corrections.
- Structured meal drafts, curated-food lookup, user-created foods, manual nutrients, saved/recent meals, confirmation, edit, delete, and deterministic totals.
- Today, seven-day history, plan, settings, export, deterministic in-app reflection, and weight history.
- Complete Persian RTL and English LTR interfaces using runtime locale switching.
- Private temporary Supabase Storage uploads and secure deletion lifecycle.
- Responsive online-only operation with accessible loading, offline, and recoverable-error states.
- Local Docker development, automated tests, GitHub Actions checks, and Darkube Docker deployment.

### 2.2 Optional feature-flagged enhancements

- AI plan-image extraction.
- AI meal-photo food recognition.
- AI-written daily reflection.
- Optional worker process and scheduled processing used by those capabilities.

Every optional enhancement must fail closed to its manual/deterministic alternative. Its absence cannot prevent core tests, build, deployment, onboarding, plan activation, meal confirmation, or reflections.

### 2.3 Non-goals

No public API, microservices, Redis, offline synchronization, PWA/service worker, web push, payments, social features, clinician portal, clinical advice, automated diet generation, standalone meal-text analysis, barcode scanning, exercise compensation, or detailed micronutrients.

### 2.4 Glossary

| Term               | Technical meaning                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Actor              | User identity derived from a verified Better Auth server session. Never a client-supplied user ID.                    |
| Canonical value    | Locale-independent persisted value, such as grams, kilograms, kcal, UTC instant, or Gregorian ISO local date.         |
| Draft              | Mutable, user-owned work that has no effect on confirmed totals or comparisons.                                       |
| Confirmed meal     | Immutable-at-confirmation nutrient snapshot that contributes to daily totals; later edits create a new revision.      |
| Plan version       | Immutable activated snapshot with a non-overlapping effective interval.                                               |
| Local date         | Gregorian `YYYY-MM-DD` representing the user's chosen calendar day in `timezoneAtEntry`; distinct from a UTC instant. |
| Known total        | Sum of non-null confirmed nutrient values. It is not a complete total when any contributor is unknown.                |
| Source revision    | Monotonic revision of inputs used to compute a summary/reflection.                                                    |
| Owner-scoped query | Database operation whose predicate includes the authenticated owner, directly or through a verified parent relation.  |
| Idempotency key    | Client-generated opaque key that makes a logical mutation produce at most one committed result.                       |
| Lease              | Time-bounded exclusive claim that permits a worker to process a job and permits recovery after worker failure.        |
| Sanitized media    | Validated, metadata-stripped/re-encoded private object approved for temporary application use.                        |
| Core mode          | Web-only deployment; all manual and deterministic flows operate without worker or AI.                                 |
| Enhanced mode      | Web plus optional worker and configured AI provider.                                                                  |

## 3. Technology baseline and dependency policy

| Layer            | Decision                                                            | Status                           |
| ---------------- | ------------------------------------------------------------------- | -------------------------------- |
| Runtime          | Current supported Node.js LTS; pin in `.nvmrc` and Docker           | Recommended                      |
| Web              | Next.js App Router, React, strict TypeScript                        | Confirmed                        |
| Localization     | `next-intl`, `/fa/...` and `/en/...`; Persian default               | Confirmed                        |
| UI               | Tailwind CSS; locally owned accessible shadcn/Radix primitives      | Confirmed                        |
| Forms/validation | React Hook Form and Zod; server validation authoritative            | Confirmed                        |
| Persistence      | Supabase Free PostgreSQL through Prisma                             | Confirmed                        |
| Authentication   | Better Auth username/password and sessions behind `IdentityService` | Preferred; verification gate     |
| Storage          | Private Supabase Storage behind `MediaStorage`                      | Confirmed                        |
| Jobs             | PostgreSQL-backed queue; optional worker from same image            | Confirmed                        |
| Nutrition        | Versioned seeded catalog plus manual/user food fallback             | Confirmed                        |
| AI               | Provider-neutral adapter; DeepSeek first candidate                  | Preferred; optional              |
| Tests            | Vitest, PostgreSQL integration tests, Playwright                    | Confirmed                        |
| Delivery         | GitHub Actions checks; Darkube Git/Docker deployment                | Confirmed; platform verification |

Do not copy the boilerplate lockfile unchanged. At project initialization, select mutually compatible stable versions, upgrade all known critical/high vulnerabilities, commit the lockfile, run build/tests/audit, and record the adopted upstream commit. Critical production dependency findings block deployment; educational-only development-tool findings require documented assessment.

## 4. System architecture

```text
Browser
  │ HTTPS; Better Auth cookie; /fa or /en
  ▼
Next.js web container on Darkube
  ├─ Server Components ───────────────┐
  ├─ Server Actions / Route Handlers  │
  ├─ Better Auth adapter              │
  └─ Application services ◄───────────┘
          │             │                 │
          ▼             ▼                 ▼
   Prisma/Postgres  Supabase Storage  Provider adapters
   (Supabase Free)  (private buckets)  (AI, future providers)
          ▲
          │ atomic claims, leases, results
Optional worker container on Darkube
  (same image, different command)
```

The browser never receives database credentials, Supabase service-role credentials, AI keys, or privileged storage keys. Services are the only layer allowed to apply domain mutations. UI transports cannot finalize plans or meals directly.

### 4.1 Deployment modes

- **Core mode:** web container plus PostgreSQL. Manual flows and deterministic on-demand reflections work.
- **Enhanced mode:** web plus worker. AI jobs, scheduled reflection pre-generation, export/cleanup retries, and asynchronous processing are available.
- The same image exposes `web` and `worker` commands. Feature flags must reflect actual worker/provider availability.

### 4.2 Execution paths and trust boundaries

| Path                     | Trusted boundary and sequence                                                                                                | Failure/degraded behavior                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Page read                | Browser → locale proxy → Server Component → session → application service → Prisma                                           | Unauthenticated redirects to localized login; database failure renders retryable page boundary without cached private data. |
| Form mutation            | Client island → Server Action → session/ownership → Zod → service transaction → revalidation                                 | Field errors are localized; conflict retains draft; no success UI before commit.                                            |
| Authentication           | Browser → Better Auth Route Handler → Better Auth tables/session cookie                                                      | Generic errors and persistent throttling; no domain service trusts an unverified cookie.                                    |
| Media upload             | Browser requests authorization → server creates owned media row/signed upload → browser uploads → server finalizes/validates | Unfinalized object is unusable and expires; declared metadata never substitutes for server verification.                    |
| AI request               | Owned draft/media → durable job → worker rechecks feature/consent/revision → provider → schema validation → draft proposal   | Timeout/provider/schema failure returns safe status and manual fallback; no confirmed record changes.                       |
| Deterministic reflection | Today read → summary service → localized template → unique reflection insert                                                 | Works in core mode; concurrent requests converge on `(userId, localDate)`.                                                  |
| Account deletion         | Reauthentication → terminal deletion state/session revocation → domain deletion → object cleanup                             | Account becomes unusable before best-effort external cleanup; cleanup carries no reusable identity credential.              |

Trust boundaries are: untrusted browser input; trusted application process; separately trusted database/storage providers; and untrusted-by-default AI output. Signed URLs grant only narrow object/time capability and are themselves secrets. Supabase dashboard/service credentials and Better Auth secrets exist only in server/worker environments.

## 5. Boilerplate adoption plan

### 5.1 Retain

- App Router and strict TypeScript configuration.
- Framework-free `services/` layer.
- Thin Server Actions: authenticate/authorize, validate, call service, revalidate.
- Prisma migration discipline and local PostgreSQL Compose service.
- Local UI primitives, logical CSS utilities, theme system, RTL lint, Persian normalization utilities, and accessible components.
- Environment validation, structured logger, Vitest factories/mocks, Playwright, Docker multi-stage build, CI, Renovate, and architecture ESLint rules.

### 5.2 Modify or replace

- Replace build-time single-locale globals and `t()` with request-scoped `next-intl`; keep both dictionaries and RTL checks.
- Replace boilerplate username/password code with Better Auth integration; do not merely reuse its custom auth service.
- Replace admin-created user management and seeded `admin/admin123`; no admin UI is in product scope.
- Replace role-only authorization with owner-scoped services.
- Add domain modules, private storage, jobs, nutrition catalog, AI adapters, export, and cleanup.
- Adjust `Permissions-Policy` to support user-initiated camera/file capture if needed; retain microphone/geolocation/payment restrictions.
- Add a Content Security Policy after identifying required Supabase and AI endpoints.
- Split database migration from replica startup.

### 5.3 Import safety

Never run the boilerplate `setup.sh` inside the existing repository: it removes a locale, rewrites documents/CI, deletes `.git`, and creates a new history. Import on a controlled branch or copy selected files, preserve project documents, and add an ADR identifying the upstream commit and divergences.

## 6. Repository and module architecture

```text
src/
  app/[locale]/
    (auth)/                 signup, login, recovery
    (onboarding)/           O01–O09 equivalents
    (app)/                  today, history, plan, settings
    api/auth/[...all]/      Better Auth handler
    api/uploads/            signed upload/finalization
    api/jobs/[id]/          owned job status
    api/downloads/          signed export/media download
    api/health/             liveness/readiness
  actions/                  thin same-origin mutation adapters
  services/                 framework-independent application services
    identity/               IdentityService facade and recovery extension
    profiles/ plans/ meals/ nutrition/ days/ reflections/
    media/ jobs/ exports/ account/
  domain/                   value objects, invariants, pure calculations
  providers/                Better Auth, Supabase Storage, AI implementations
  components/ui/            owned primitives
  components/features/      domain UI
  lib/                      env, prisma, logger, locale, dates, errors
  messages/fa.json
  messages/en.json
  worker/                   runner and registered job handlers
prisma/
  schema.prisma
  migrations/
  seeds/nutrition/v1.*
e2e/
docs/decisions/
```

Rules enforced by ESLint:

- Client components cannot import Prisma, services, server-only providers, or secrets.
- Server route files read through services, never Prisma directly.
- Actions and route handlers do not contain business rules.
- Services may depend on repositories/provider interfaces, not React or Next.js.
- Pure `domain/` code has no framework, I/O, clock, locale, or database dependency.
- Cross-module writes go through the owning service.

Use a modular monolith, not generic repository layers for every table. Introduce an interface only at an actual change boundary: identity, media storage, AI, nutrition source, clock, and job runner.

### 6.1 Module contracts and transaction ownership

Each domain module exports a small service API and owns writes to its tables. Other modules may consume read models or call the service; they may not mutate another module's Prisma models directly.

| Module      | Owns                                                         | Key public operations                                                                 |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Identity    | Better Auth integration, recovery credential, auth throttles | register, authenticate, reauthenticate, recover, rotate code, revoke, delete identity |
| Profiles    | profile, consent, preferences, onboarding state              | read/update profile, advance onboarding, grant/revoke consent                         |
| Plans       | plan drafts, immutable versions/days/slots/rules             | create/edit draft, activate, replace, correct history, get applicable version         |
| Nutrition   | catalog versions/foods/servings and user foods               | search, resolve portion, create/update private food, snapshot nutrients               |
| Meals       | meal drafts/items, confirmed meals/items, saved meals        | edit draft, confirm, revise, delete/undo, save/reuse snapshot                         |
| Days        | day state, slot occurrences, derived summaries               | complete/reopen, mark slot, rebuild/read summary                                      |
| Reflections | reflection and feedback                                      | get/create deterministic, enqueue AI, set/remove feedback                             |
| Media       | media metadata and storage adapter                           | authorize, finalize, sign read, attach, delete, expire                                |
| Jobs        | durable queue and leases                                     | enqueue, claim, heartbeat, succeed, retry/fail/cancel                                 |
| Accounts    | export and deletion orchestration                            | request/build export, begin/finish deletion                                           |

The service initiating a multi-module business operation owns its transaction and calls transaction-aware internal functions with a Prisma transaction client. Do not start nested independent transactions. External network calls never occur inside a database transaction. Instead, commit intent/job state, perform I/O, then commit a revision-checked result.

## 7. Authentication and account security

### 7.1 Better Auth verification gate

Before adoption, create a spike proving the selected Better Auth release works with the pinned Next.js/Prisma/PostgreSQL versions, Docker standalone output, locale-prefixed routes, secure cookies behind Darkube proxy headers, and migrations. Review its schema and cookie/session semantics. If validation fails, return to owner decision; do not silently write custom auth.

`IdentityService` exposes only application needs: register, authenticate, require session, reauthenticate, change password, issue/verify/rotate recovery code, revoke session(s), and delete identity. Domain services accept an authenticated actor ID, not Better Auth objects.

### 7.2 Registration and login

- Public registration with normalized unique username and password.
- Username: Unicode policy must be explicit. Recommended MVP: 3–32 characters, Latin letters/digits/underscore only, case-insensitive canonical form, separate optional display name. This avoids confusable identifier problems while UI remains bilingual.
- Password: minimum 10 characters, maximum 128, allow password-manager paste, no composition rules, reject known placeholder/demo password in production.
- Use Better Auth's supported password hashing defaults; do not implement hashing.
- Generic errors do not reveal whether a username exists.
- Persistent database-backed throttles for registration, login, and recovery by normalized username plus privacy-conscious IP hash/window. Suggested starting limits: registration 5/hour/IP; login 10/15 minutes/account and 30/15 minutes/IP; recovery 5/15 minutes/account and 20/15 minutes/IP. Values are configuration, not product truth.
- Cookies: `HttpOnly`, `Secure` in deployed environments, `SameSite=Lax`, host-only where possible, bounded lifetime. Recommended session maximum seven days; rotate/revalidate according to Better Auth support.
- Mutations rely on same-origin Server Actions/Route Handlers and framework origin validation; add explicit CSRF protection where an endpoint does not inherit it.

### 7.3 Recovery code

- Generate at registration using a CSPRNG with at least 128 bits of entropy; encode in grouped user-friendly characters and show once.
- Store only a slow password-style hash or keyed cryptographic hash appropriate for high-entropy tokens; never log or persist plaintext.
- Require username, new password, and recovery code. Return generic failures and throttle persistently.
- In one database transaction: verify unused code, update password through Better Auth-compatible API, revoke all sessions, mark the code consumed, and store a new recovery-code hash. Show the replacement code once only after commit.
- Authenticated regeneration requires fresh password reauthentication; it invalidates the old code and revokes other sessions if supported.
- Losing both factors is explicitly unrecoverable; no support/admin bypass, email, or SMS reset.

## 8. Authorization and ownership

Supabase is infrastructure, not a browser data API. Disable anonymous access to application schemas/tables, do not expose the database role to clients, and never ship a service-role key. Prisma connects using a dedicated least-privileged role where Supabase permits it.

Every private service obtains `actorUserId` from the verified server session. Client input never supplies authoritative ownership. Reads use `where: {id, userId: actorUserId}` or parent-owner joins. Creates inject ownership server-side. Updates/deletes use owner-constrained predicates and distinguish not-found from unauthorized only in internal logs.

Use foreign keys, cascades/restrict behavior, uniqueness, and compound indexes to prevent cross-owner links. Examples: a meal's plan/slot must belong to the same user; a job/media/result must share owner; reflection feedback must reference an owned reflection. Where a simple FK cannot express same-owner consistency, validate transactionally and test it.

Custom PostgreSQL RLS identity propagation is deferred. Required integration tests attempt cross-account reads, edits, deletes, media access, job polling, export download, and identifier substitution.

## 9. Data model and invariants

Prisma names are illustrative; migrations are the physical source after implementation.

### 9.1 Identity and preferences

- Better Auth tables (`User`, `Session`, `Account`, `Verification`) as generated/approved.
- `RecoveryCredential(userId unique, codeHash, generation, createdAt, consumedAt?)`.
- `Profile(userId PK/FK, preferredName?, age, goal, unitSystem, timezone, locale, onboardingStep, onboardingCompleteAt?, createdAt, updatedAt)`.
- `Consent(id, userId, purpose, policyVersion, grantedAt, revokedAt?)`; purposes separately represent plan image, meal image, and AI reflection even if one screen collects them.
- `Preferences(userId PK, theme, morningTime, weightTrackingEnabled)`; no active push fields in MVP.

### 9.2 Plans

- `PlanDraft(id, userId, sourceType, state, revision, title?, sourceNote?, medicalBoundary, createdAt, updatedAt)`.
- Mutable draft children for days, slots, options, alternatives, and targets.
- `DietPlanVersion(id, userId, status, effectiveFrom, effectiveTo?, schemaVersion, sourceType, correctionReason?, createdAt)` and immutable child snapshots.
- No overlapping effective intervals per user. Validate inside a serializable/retryable transaction; use an exclusion constraint through SQL migration if compatible.
- Activation requires ownership, current revision, eligible scope, resolved required fields, and an idempotency key.
- First plan defaults to current local date; replacement to next local date; historical correction is audited and invalidates only affected summaries.

### 9.3 Nutrition and foods

- `CatalogVersion(id, version unique, sourceDocument, licenseNote, importedAt)`.
- `CatalogFood(id, versionId, canonicalNameFa, canonicalNameEn?, aliases, basisGrams, energyKcal?, proteinG?, carbohydrateG?, fatG?, fiberG?, confidenceLabel, sourceCitation)`.
- `CatalogServing(id, foodId, labelFa, labelEn?, grams, notes?)`.
- `UserFood(id, userId, name, basisAmount, basisUnit, nutrient fields nullable, sourceNote?, revision, timestamps)`.
- Seed approximately 100–150 common Iranian/general foods. Every value needs a cited source and measurement basis. Unknown is `NULL`, never zero. Seed changes create a new catalog version; confirmed meals retain frozen source/version snapshots.

### 9.4 Meals and days

- `MealDraft(id, userId, state, consumedAtUtc, localDate, timezoneAtEntry, mealType, linkedSlotId?, revision, idempotencyKey?, timestamps)` plus draft items.
- `Meal(id, userId, status=CONFIRMED, consumedAtUtc, localDate, timezoneAtEntry, planVersionId?, slotId?, revision, timestamps)`.
- `MealItem(id, mealId, displayName, grams?, householdQuantity?, energyKcal?, proteinG?, carbohydrateG?, fatG?, fiberG?, sourceType, sourceId?, sourceVersion?, preparationNotes?, userOverrideJson?, snapshotBasis)`.
- `SavedMeal` stores a user-owned snapshot; use copies into a new draft.
- `DayState(userId, localDate, completedAt?, revision, reopenedAt?, unique(userId,localDate))`.
- `PlanSlotOccurrence(userId, localDate, planVersionId, slotId, explicitState?, revision, unique(...))`.
- Confirmed meals only affect totals. A confirmed meal link makes a slot recorded and clears explicit skipped; removing the last linked meal does not restore skipped automatically.

### 9.5 Reflections, weights, jobs, media, audit

- `DailySummary(userId, localDate, sourceRevision, known totals, unknown counts, comparison JSON, computedAt)` is rebuildable cache.
- `MorningReflection(userId, localDate, locale, body, sourceRevision, generationMethod, generatedAt, unique(userId,localDate))`.
- `ReflectionFeedback(reflectionId, userId, value, updatedAt, unique(reflectionId,userId))`.
- `WeightEntry(id, userId, measuredAt, localDate, weightKg, revision, timestamps)`.
- `MediaAsset(id, userId, bucket, objectPath unique, purpose, state, mimeType, byteSize, sha256?, retentionDeadline, deletedAt?, timestamps)`.
- `Job(id, userId?, type, state, payloadVersion, payloadJson, resultJson?, idempotencyKey unique, attempts, maxAttempts, runAfter, leaseOwner?, leaseUntil?, safeErrorCode?, timestamps)`.
- `AuditEvent(id, actorUserId?, action, entityType, entityId?, requestId, safeMetadataJson, createdAt)`; never raw meals, images, passwords, codes, tokens, or AI prompts.
- `AiAnalysis(id, userId, jobId unique, purpose, provider, model, inputMediaId?, draftType, draftId, draftRevision, schemaVersion, promptVersion, state, safeErrorCode?, tokenUsageJson?, latencyMs?, createdAt, completedAt?)`. Structured proposals live in the owned draft/result, never in a confirmed record.
- `RateLimitBucket(scope, subjectHash, windowStartedAt, count, blockedUntil?, updatedAt, primary key(scope,subjectHash,windowStartedAt))`. Subject hashes use a rotating server pepper where IP-derived.
- `MutationReceipt(userId, operation, idempotencyKey, requestHash, resultEntityId?, status, expiresAt, createdAt, unique(userId,operation,idempotencyKey))` for high-risk create/confirm operations.
- `AccountDeletion(id, formerUserRef unique, state, requestedAt, domainDeletedAt?, storageCleanupState, completedAt?, safeErrorCode?)`. `formerUserRef` is an opaque random deletion reference, not username; it exists only while cleanup is incomplete and has no authentication relationship.

Use `Decimal` for stored nutrient and weight values; application code rounds only for display. Index every FK and common `(userId, localDate/status/effectiveFrom)` query.

### 9.6 Physical schema contract

All identifiers are CUID/UUID strings consistently generated server-side. All timestamps are timezone-aware PostgreSQL timestamps and all local dates are PostgreSQL `date`. Decimal precision must cover realistic food values without floats; recommended `Decimal(12,4)` for nutrients/grams and `Decimal(8,3)` for kilograms, validated by domain bounds. JSON is allowed only for versioned snapshots/provider metadata whose shape is Zod-validated; core relations and searchable fields remain normalized.

Required constraints include:

- `Profile.age >= 18` and enum/check constraints for goal, locale, unit system, states, nutrient/rule types, and generation methods.
- Nutrients, grams, servings, weights, byte sizes, attempts, and quotas are non-negative; exact/min/max/range rules have valid bound combinations and `lower <= upper`.
- `effectiveTo IS NULL OR effectiveTo >= effectiveFrom`; only one applicable plan per user/date, enforced transactionally and preferably with a PostgreSQL exclusion constraint after compatibility testing.
- Unique `(userId, localDate)` for day/summary/reflection, unique slot occurrence key, unique catalog `(versionId, normalizedNameFa)`, and unique normalized username in Better Auth's user identity.
- Confirmed meal items require a frozen `sourceType` and `snapshotBasis`; catalog/user-food foreign keys may be nullable so historic snapshots survive source deletion.
- `MediaAsset.objectPath` and job/mutation idempotency keys are unique; a media row cannot attach across owners or incompatible purposes.
- Parent deletes cascade only for truly owned dependent data. Historic plan/meal snapshots use restrict or explicit orchestrated deletion during account deletion; catalog deletion is prohibited once referenced.

Indexes required at first migration review:

- plans `(userId,effectiveFrom,effectiveTo)` and drafts `(userId,state,updatedAt)`;
- meals `(userId,localDate,consumedAtUtc)`, drafts `(userId,state,updatedAt)`, meal items `(mealId)`;
- catalog normalized names/aliases and user foods `(userId,normalizedName)`;
- jobs `(state,runAfter,leaseUntil)` plus `(userId,createdAt)`;
- media `(state,retentionDeadline)` plus `(userId,purpose,createdAt)`;
- weights `(userId,localDate,measuredAt)` and audit `(actorUserId,createdAt)`.

### 9.7 Plan rules, alternatives, and unsupported instructions

Represent plan contents structurally rather than as a single JSON blob:

- `PlanDaySnapshot(id, planVersionId, templateKind, weekday?)` where weekday is canonical ISO 1–7 and exactly one daily-template or applicable weekday mapping exists.
- `PlanSlotSnapshot(id, planDayId, stableKey, label, preferredLocalTime?, sortOrder)`.
- `PlanFoodOptionSnapshot(id, slotId, catalogFoodId?, sourceName, portionMin?, portionMax?, portionUnit, groupKey?, sortOrder)`.
- `PlanRuleSnapshot(id, planVersionId, slotId?, nutrient?, ruleType, lower?, upper?, exact?, unit, sourceText, supportState)`.
- `PlanInstructionSnapshot(id, planVersionId, slotId?, sourceText, normalizedKind?, supportState)` preserves instructions that cannot be safely evaluated. `supportState` is `SUPPORTED`, `DISPLAY_ONLY`, or `UNRESOLVED`; display-only/unresolved instructions never affect alignment.
- Alternatives share a `groupKey`; choosing one option satisfies that group only when its portion rule is deterministically evaluable. A user-confirmed substitution is stored on the meal item/slot mapping as an explicit snapshot and explanation, never inferred permanently from AI.

### 9.8 Retention matrix

| Data                                      | Retention in active account                                                  | Deletion trigger                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Confirmed plans/meals/weights/reflections | Until user deletes entity or account                                         | Explicit entity/account deletion                                  |
| Drafts without confirmation               | Seven days after last activity unless actively resumed                       | Cleanup job/on-access cleanup                                     |
| Uploaded/processed meal or plan images    | Through review/confirmation only                                             | Confirmation, cancellation, seven-day expiry, or account deletion |
| AI structured analysis metadata           | Safe operational metadata for 30 days; proposal retained only with its draft | Expiry/account deletion; raw media follows media rule             |
| Export objects                            | Short-lived, recommended 24 hours                                            | Expiry/account deletion                                           |
| Jobs                                      | Payload/result minimized; terminal records recommended 30 days               | Cleanup/account deletion                                          |
| Rate-limit buckets                        | Window plus short abuse-review period, recommended seven days                | Scheduled/on-access cleanup                                       |
| Audit events                              | Educational MVP recommendation 90 days, excluding sensitive content          | Expiry/account deletion where applicable                          |
| External best-effort backups              | Until documented backup expiration                                           | Backup rotation; deletion is not immediate inside existing dump   |

## 10. Deterministic calculations

Pure domain functions must be fully unit-tested.

For a catalog value `N_basis` measured per `basisGrams`, confirmed grams `g` yields:

```text
N_consumed = N_basis × g / basisGrams
```

If `N_basis` or `g` is unknown, the result is unknown. Sum known values separately from `unknownItemCount`. A daily nutrient with unknown contributors is presented as “at least known total”; it cannot produce within/below claims. Source energy is authoritative; macro-derived energy may flag review but never overwrite.

Canonical storage: grams, kilograms, kcal, UTC instants, Gregorian `YYYY-MM-DD` local dates, and IANA zones. Imperial/household inputs convert through explicit versioned conversions. Reject future consumed instants. Preserve recorded `localDate` when timezone preference changes.

Alignment implements product section 10 exactly: completeness, slot match, and target comparison are separate. Partial days cannot be below/within; known intake may already be above a maximum. Exact target has no implicit tolerance. No aggregate adherence score.

Every mutation affecting a confirmed meal, plan timeline, slot state, or completeness increments a revision and invalidates/rebuilds affected summaries. Optimistic writes require expected revision; stale writes return `CONFLICT` and retain the user's draft.

### 10.1 Deterministic decision contracts

- **Portion conversion:** only a catalog serving with explicit grams or a user-entered gram value permits per-100-g scaling. A household label without a conversion remains unresolved.
- **Manual override:** store original source snapshot and overridden value/reason separately. The confirmed value is the override; provenance remains visible.
- **Substitution:** exact catalog/portion matches may be automatic; alternative-group or non-exact substitutions require explicit user confirmation. Substitution never changes the plan version.
- **Unsupported plan instruction:** display the original text with `DISPLAY_ONLY`/`UNRESOLVED`; exclude it from computed alignment and explain why.
- **Day completion:** explicit user act. Any confirmed meal create/edit/delete affecting that local date clears completion in the same transaction.
- **Meal delete/undo:** deletion uses a `pendingDeletionUntil`/tombstone for ten seconds or an equivalent reversible state; totals exclude only after committed deletion. Undo must be idempotent. Account deletion has no undo.
- **Reflection freshness:** if current summary revision differs from reflection `sourceRevision`, label the reflection as based on an earlier snapshot; never silently rewrite an AI reflection. A deterministic reflection may be regenerated only by an explicit documented rule.
- **Weight trend:** at least two entries; show observed difference/line only. No BMI, causal attribution, forecast, or automatic target.
- **Export:** versioned archive manifest plus UTF-8 JSON and CSV where tabular. Include profile/preferences/consents, plan versions, meals/provenance, saved/user foods, day state, weights, and reflections; exclude password/session/recovery hashes, internal throttles, raw deleted images, and secrets.

### 10.2 Transaction and concurrency matrix

| Operation                  | Atomic requirements                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Register                   | Identity + recovery hash + initial profile shell; failure leaves no usable partial account.                                                   |
| Recover account            | Consume code + password update + new recovery hash + session revocation.                                                                      |
| Activate/replace plan      | Lock/validate timeline + create immutable snapshot + close predecessor + audit + invalidate affected summaries + consume idempotency key.     |
| Confirm meal               | Validate current draft revision + create meal/item snapshots + slot-state update + reopen day + invalidate summary + consume idempotency key. |
| Revise/delete meal         | Expected revision + new snapshot/tombstone + reopen day + summary invalidation.                                                               |
| Historical plan correction | Lock timeline + add correction version + audit affected range + enqueue/mark recomputation.                                                   |
| Account deletion           | Terminal account state/session revocation precedes domain removal; storage cleanup is outbox/job work after commit.                           |

Use database uniqueness as the final duplicate defense. Application checks improve messages but cannot replace constraints.

## 11. Workflows and state machines

```text
Onboarding: started → required_profile_complete → complete
Plan draft: editing → [uploading → queued → extracting] → ready_for_review → activated
Meal draft: editing → [uploading → queued → recognizing] → ready_for_review → confirmed
Job: queued → running → succeeded | retry_wait → queued | failed | canceled | superseded
Media: pending_upload → uploaded → sanitized → attached → deleting → deleted
Account: active → deleting → deleted
```

Bracketed AI transitions exist only when feature and worker/provider are enabled. Failure returns the draft to editable/retryable state with manual fallback. Job completion compares draft revision and consent before writing; stale, revoked, deleted, canceled, or superseded results are discarded.

Meal confirmation and plan activation are transactional and idempotent. Account deletion first marks identity/account terminal and revokes sessions so partial cleanup cannot restore access; then transactionally deletes domain rows. Storage deletion retries through a cleanup job when the worker is available or is attempted again by the web cleanup path.

Deterministic reflections are generated on first eligible Today read if absent, so no continuous worker is required. They use yesterday's latest server summary and approved localized templates. AI reflections may be queued when enhanced mode is enabled.

## 12. Server Actions and Route Handlers

Use Server Actions for profile/onboarding, plan draft edits/activation, meal draft edits/confirmation, saved meals, completeness, slot state, weights, consent, feedback, password/recovery management, and account deletion.

Use Route Handlers for Better Auth, upload authorization/finalization, signed downloads, owned job status, health endpoints, and future provider callbacks. There is no general public REST API.

All mutations follow:

1. Resolve request/session and locale.
2. Authorize capability and derive actor ID.
3. Parse `unknown` input with Zod and normalize digits/units.
4. Call one application service with idempotency/expected revision.
5. Map domain errors to stable safe codes.
6. Revalidate affected paths and return structured result.

Error shape: `{code, messageKey, fieldErrors?, retryable, requestId}`. Logs contain the request ID and internal cause, not sensitive payloads.

## 13. Localization, dates, and direction

- Routes are `/{locale}/...`, locale ∈ `fa|en`; `/` redirects to `/fa` for first visit.
- `next-intl` loads request-scoped messages. Both dictionaries must have key parity enforced in CI.
- Signed-out preference uses a cookie; authenticated preference is stored in `Profile.locale` and mirrored to the cookie. Switching locale replaces only the locale segment and preserves path/query/draft where safe.
- Root layout sets correct `lang` and `dir`; Persian uses RTL and English LTR. Use logical CSS only. Mixed user text uses `dir="auto"` and remains byte-for-byte unchanged.
- Accept Persian, Arabic-Indic, and Latin digits; normalize before validation. Display Persian numerals in `fa`, Latin in `en`.
- Use `Intl` with `fa-IR-u-ca-persian` for Persian presentation and localized Gregorian for English. Persist Gregorian dates and UTC instants only.
- Default timezone is `Asia/Tehran`; schedule and local-date computations use the stored IANA zone. Tests cover midnight, timezone change, invalid local times, and round trips.
- Validation, auth, accessibility labels, errors, deterministic templates, catalog names, and legal copy are bilingual.

## 14. Frontend and state management

Server Components perform initial reads through services. Client components are limited to interactive forms, dialogs, upload progress, optimistic local draft editing, and polling. Do not add a global state library unless an actual cross-route requirement emerges.

Persist server-side drafts for onboarding, plans, and meals. Browser storage may preserve non-sensitive transient form state with short lifetime; never persist passwords, recovery codes, raw images, health exports, or AI payloads. Online-only mutations disable with a clear offline banner and retain the active in-memory form.

Meet mobile support from 320 px, 44×44 touch targets, keyboard/focus behavior, screen-reader announcements, WCAG 2.2 AA target, reduced motion, light/dark/system themes, and no horizontal scroll in core journeys. Test representative current Chrome/Android, Safari/iOS, Firefox, and desktop Chromium; exact supported versions are documented at implementation start.

## 15. Private media storage

Use a `MediaStorage` interface with a Supabase implementation. Buckets are private. Supabase privileged keys remain server-only.

Upload flow:

1. Authenticated action validates purpose, declared MIME/size, quota, consent, and ownership; creates `MediaAsset(pending_upload)` with an unguessable owner-prefixed path.
2. Server returns a short-lived signed upload token/URL or performs a bounded server upload, depending on verified Supabase capability.
3. Finalization verifies the object, actual size, magic bytes, decoded dimensions, and allowed JPEG/PNG/WebP type; strips EXIF and re-encodes to a safe format where feasible.
4. Only the owner receives short-lived signed view/download access.
5. AI workers receive bytes server-side only after active consent and feature checks.

Plan images remain available through review and are deleted after successful activation, including processed copies. Meal images follow the same temporary principle and are deleted after confirmed recognition review/meal confirmation. Failed/unattached uploads expire after seven days. Deletion errors set `deleting`, log safe metadata, and retry. No arbitrary remote URL import.

Initial limits: product permits plan images up to 10 MB; use the same or a lower documented meal-photo limit after a mobile prototype. Also enforce decoded pixel limits to prevent decompression bombs.

## 16. Background jobs and worker

The queue is PostgreSQL-based. Workers claim jobs atomically with `FOR UPDATE SKIP LOCKED` or an equivalent Prisma raw transaction, set a lease, heartbeat long work, and recover expired leases. Handlers are idempotent. Suggested maximum attempts: three total for transient failures with exponential backoff and jitter; validation/schema failures do not loop.

Registered optional jobs: `PLAN_IMAGE_EXTRACT`, `MEAL_PHOTO_RECOGNIZE`, `AI_REFLECTION`, `EXPORT_BUILD`, `MEDIA_DELETE`, `MEDIA_EXPIRE`, and `SUMMARY_REBUILD`. Core mode may execute small cleanup/export work synchronously or on user retry; it never runs long AI calls in a request.

Worker command and web command share the same image. Darkube enhanced deployment runs a separate app/process with no public port. Environment flag `WORKER_ENABLED` is descriptive; web feature availability also checks AI configuration and a recent worker heartbeat to avoid queuing work that cannot run.

### 16.1 Queue contract

- Enqueue and the business event requiring the job commit in one transaction or through an outbox-style job row.
- Claim only `QUEUED/RETRY_WAIT` jobs whose `runAfter <= now`, ordered by `runAfter,id`, with a short transaction and `SKIP LOCKED` semantics.
- Claim sets `RUNNING`, `leaseOwner`, `leaseUntil`, and increments `attempts`. The worker performs external I/O after the claim transaction.
- Heartbeat extends a lease only for the current owner. Completion/update predicates include job ID, lease owner, state, and expected draft revision.
- An expired `RUNNING` job becomes retryable unless attempts are exhausted. A periodic sweep may be worker-driven; web admin-free recovery may also occur opportunistically on enqueue/status reads.
- Cancellation is cooperative: set `CANCELED`; late provider results fail the state/revision predicate and are discarded.
- Payloads contain owned IDs and schema versions, not raw media bytes or credentials. Errors use stable safe codes; stack/provider bodies remain redacted logs.
- Terminal jobs are immutable except cleanup metadata. `FAILED` is visible with manual fallback; no infinite retry or silent poison queue.

## 17. AI architecture

`AiProvider` operations:

- `parseDietPlanImage(input) -> versioned PlanExtractionDraft`
- `recognizeMealPhoto(input, context?) -> versioned FoodRecognitionDraft`
- `writeMorningReflection(allowlistedSummary) -> text`

DeepSeek is the first candidate, not a capability guarantee. **Requires Verification:** actual account/model supports required image inputs, structured responses, Persian/mixed text, acceptable privacy/retention, connectivity from Darkube, latency, and affordable quotas. Never silently fail over to another provider.

Feature flags: `AI_PLAN_IMAGE_ENABLED`, `AI_MEAL_PHOTO_ENABLED`, `AI_REFLECTION_ENABLED`, plus server credential/model configuration. UI exposes a feature only when configured; manual alternatives remain visible.

Validate every output with a versioned Zod schema; allow one constrained repair attempt. Treat image text as untrusted prompt injection. Models cannot call tools, execute code, calculate authoritative nutrition, activate plans, confirm meals, change targets, or send notifications. Suggested foods resolve against the curated catalog or remain manual/unknown. Store model ID, prompt/schema version, latency, token use, validation outcome, and safe error code—not raw images or sensitive prompts.

Start with configurable low limits such as five plan images/day/user, ten meal images/day/user, and one AI reflection/user/local day. A global daily ceiling and kill switch prevent accidental course costs. Withdrawal of the relevant consent cancels queued work where possible and rejects late results.

### 17.1 AI error taxonomy and result contract

Stable categories: `FEATURE_DISABLED`, `NO_CONSENT`, `QUOTA_EXCEEDED`, `MEDIA_INVALID`, `PROVIDER_AUTH`, `PROVIDER_RATE_LIMIT`, `PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, `OUTPUT_INVALID`, `OUTPUT_UNSAFE`, `STALE_REVISION`, `CANCELED`, and `UNKNOWN`. Only transport/rate-limit/unavailable categories are retryable, honoring `Retry-After` when bounded. Authentication/configuration errors trip the feature health state and do not retry per user.

Every structured result includes `schemaVersion`, `provider`, `model`, `promptVersion`, `assumptions[]`, `unresolvedFields[]`, and candidates with provider confidence only when the provider supplies a meaningful value. Confidence is advisory and never converted into nutrition certainty. Raw provider responses are held in memory only unless a short-lived redacted debug capture is explicitly enabled in a non-production environment.

## 18. Nutrition catalog

Seed 100–150 foods prioritized for common Iranian meals and general staples. A seed manifest contains version, source title/URL or publication, license/usage note, measurement basis, reviewed date, and transformation notes. Do not scrape or invent values. Each food indicates complete, incomplete, or estimated/source-derived status.

Search normalizes Persian/Arabic characters and digits, checks Persian name and aliases, and may use PostgreSQL trigram search only if extension support is verified; otherwise use indexed normalized prefix/substring search suitable for the small catalog. User-created foods are private and never merge into the curated catalog.

`NutritionSource` abstracts lookup so a future external API can be added. Confirmed meal items freeze nutrient and provenance snapshots; catalog corrections do not rewrite history.

## 19. Privacy, security, and lifecycle

Essential MVP controls:

- TLS only; secure cookies; validated proxy/origin configuration.
- Server-only secrets with Zod boot validation and separate local/test/deploy values.
- Least-privilege Supabase database role and private buckets.
- Authorization-first services and cross-account tests.
- Zod validation, bounded inputs, parameterized Prisma queries, safe file processing, and output escaping.
- CSP, `nosniff`, frame denial, strict referrer policy, HSTS in production, and purpose-appropriate Permissions Policy.
- Structured redacted logging; no food/plan/image/password/code/token in URLs, analytics, or logs.
- No advertising trackers. Minimal aggregate product telemetry only if later approved.
- AI consent recorded per purpose; withdrawal prevents new calls.
- Dependency audit and secret scanning in CI where available at no cost.

Security acceptance details:

- State-changing Route Handlers accept only intended methods/content types, validate `Origin`/`Host` against configured application origins, and never enable permissive CORS. Server Actions retain framework origin protections and authorize again inside the action.
- CSP starts in report-only during development and moves to enforcement before deployed-MVP sign-off. Default deny; permit scripts/styles/fonts/images/connections only for self and explicitly verified Next.js/Supabase endpoints. Never add `*` to accommodate an integration.
- Proxy headers are trusted only from the Darkube ingress configuration verified in deployment; otherwise client IP, scheme, and host are untrusted.
- Signed media/export URLs are short-lived, purpose-specific, and never logged. Object names contain no username, food, plan, or medical text.
- Password, recovery, session, upload-token, and service-key values are covered by automated log-redaction tests.
- File validation tests include extension/MIME mismatch, polyglot/truncated image, oversized dimensions, decompression bomb, EXIF/geolocation removal, cross-owner object path, expired signature, and repeated finalization.
- AI tests include prompt instructions embedded in images, malformed/oversized output, unexpected fields, invented nutrition, stale result, revoked consent, and deleted account.

Immediate account deletion:

1. Require current password reauthentication and explicit irreversible confirmation.
2. Mark account deleting and revoke sessions before cleanup.
3. Delete/cascade plans, meals, weights, custom foods, reflections, preferences, consents, jobs/results, recovery credential, and identity in a controlled transaction/order.
4. Delete owned storage objects; persist minimal non-identifying cleanup tombstone/job only if deletion must retry.
5. Sign out and deny all further access.

Any independent best-effort backup may retain deleted records until expiration; disclose this. No account recovery grace period or support reset.

## 20. Supabase Free constraints and recovery

As verified on 2026-11-15 from official Supabase documentation, the Free plan currently advertises 500 MB database quota, 1 GB file storage, 5 GB egress, two active projects, no automatic backups/PITR, and possible pause after about one week of low activity. Limits can change and must be rechecked before setup/deployment.

The deployed app must monitor approximate database/storage use and document upgrade thresholds (recommended warning at 70%, action at 85%). Large media is temporary by design. A paused project produces a maintenance/retry state, not data-loss claims.

Recovery is **best effort**, not an SLA. A learning-friendly optional procedure may run a manual or scheduled `pg_dump` through a verified direct/session endpoint, encrypt locally, and store outside the primary project if free capacity exists. Never store plaintext dumps in Git or public storage. Document and rehearse restore to local PostgreSQL. Production requires automated independent backups, retention alerts, and defined RPO/RTO.

Connectivity **Requires Verification** from an actual Darkube container: DNS, TLS chain, IPv4/IPv6, round-trip latency, sustained connections, Supabase Storage, and AI endpoints. For Prisma, use the Supabase session pooler on IPv4 persistent containers unless tests support direct IPv6. Use a separate migration URL appropriate for Prisma migrations. Set conservative `connection_limit`, connection/acquire timeouts, and count combined web/worker replicas. Transaction-mode pooler requires Prisma-compatible prepared-statement settings and should be used only if needed.

## 21. Observability and operations

Use JSON logs in deployed containers and pretty logs locally. Common fields: timestamp, level, service (`web|worker`), environment, request/job ID, route/action, safe error code, duration, and provider/model metadata where safe. Redact credentials and domain content.

Essential metrics may initially be derived from logs/database admin screens: HTTP errors/latency, failed login/recovery throttles, DB pool errors, job counts by state, stale leases, AI latency/failures/cost counters, media cleanup backlog, and quota estimates. Darkube log retention/alerts **Require Verification**. External paid observability is deferred.

Expose `/api/health/live` without dependencies and `/api/health/ready` with a short database check. Do not disclose connection details. Worker heartbeat is stored in DB. Provide runbooks for paused Supabase project, migration failure, exhausted connections/quota, stuck jobs, provider outage, leaked secret rotation, and restore exercise.

## 22. Performance and scalability

Retain product targets as measurement goals, not provider SLAs: p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 on representative mobile/4G; confirmed meal save p95 ≤1.5 s under test conditions; no indefinite spinners. AI latency targets apply only when enabled.

Use server rendering, route-level loading/error boundaries, pagination for history/saved foods, bounded payloads, indexed owner/date queries, dynamic import for heavy client widgets, and image dimension limits. Avoid premature caching of user-private data. Cache immutable catalog/version data server-side with explicit invalidation.

Scale web and optional worker independently within Supabase connection limits. Future scale path: paid Supabase/alternative PostgreSQL, independent object store, automated backups, more worker replicas with leases, stronger rate-limit store, RLS defense in depth, and CDN/public static assets—not microservices by default.

### 22.1 Educational planning envelope and budgets

These are sizing assumptions for design/testing, not guarantees: tens of concurrent users, hundreds of registered course/demo accounts, at most low thousands of meals, and media retained for minutes/days rather than permanently. Re-measure rather than extrapolate if usage approaches Supabase quotas.

- Web instances start with a conservative Prisma pool (for example 2–5 connections per instance) and must leave headroom for Supabase services, migrations, and an optional worker.
- Worker concurrency defaults to one AI/image job per process until memory/latency is measured. It is configurable and never derived from queue depth without a connection/provider budget.
- Decode/re-encode one bounded image at a time; reject before full processing where headers reveal excessive bytes/dimensions. Measure peak RSS with the maximum accepted image before deployment.
- Catalog search returns a bounded first page (recommended 20 results); history and saved meals paginate; no unbounded `findMany` on user growth paths.
- Private responses use `no-store` unless a user-scoped cache is explicitly proven safe. Immutable static assets may use long cache headers; signed private URLs do not become public cache keys.
- Scaling triggers for review: sustained DB pool waits/errors, p95 save latency above target, worker queue age beyond job budget, database/storage above 70%, or web memory/CPU saturation visible in Darkube.

## 23. Testing and quality gates

### 23.1 Test layers

- **Unit:** nutrition scaling/null propagation, alignment tables, plan timeline, local dates/timezones, Persian normalization, reflection templates, state transitions, recovery token helpers, and AI schema parsing.
- **Service integration:** real isolated PostgreSQL for migrations, transactions, uniqueness, idempotency, optimistic revision, cascades, job claims, and owner isolation.
- **Provider contract:** mocked Better Auth/Storage/AI plus explicitly configured staging tests for signed private storage and live AI experiments.
- **E2E:** registration/recovery-code acknowledgement, login, onboarding resume, manual plan activation, manual meal confirmation, Today/history, language switch, weight opt-in, export, and immediate account deletion in Persian and English.
- **Optional AI E2E:** feature-enabled plan and meal image flows with fixtures and deterministic provider mocks; live evaluation is manual/gated.
- **Accessibility/responsive:** keyboard, focus return, announcements, contrast, reduced motion, 320 px/mobile/desktop, RTL/LTR.

Critical security matrix: user B cannot read/mutate user A's entity IDs; signed media links are short-lived and owner-authorized; job IDs and exports are isolated; stale revisions fail; double confirmation creates one record; deleted sessions fail.

### 23.2 CI gates

GitHub Actions on pull requests and `main`: clean install, Prisma generate, architecture/RTL lint, formatting check, TypeScript, essential unit/integration tests, production build, and migration-from-empty test. Run `npm audit`/Dependabot and secret scanning where available; triage findings rather than blindly applying breaking fixes. Playwright critical flows may run once setup is stable.

### 23.3 Release evidence

A deployed educational-MVP release is acceptable only when evidence identifies commit, migration version, configuration mode, and test run, and demonstrates:

1. fresh local database migration/seed and production build;
2. Darkube web readiness plus localized `/fa` and `/en` smoke flows;
3. registration, recovery-code acknowledgement, login/logout, and session rejection after account deletion;
4. manual plan → meal → Today/history vertical slice with AI disabled;
5. unknown nutrients, partial day, idempotent double-confirm, stale revision, and cross-account denial;
6. private upload owner isolation and post-confirm/expiry cleanup in an integration environment;
7. deterministic reflection without worker/provider;
8. rollback procedure documented and last compatible image identifiable;
9. optional AI tests excluded from core pass/fail unless the release explicitly enables that feature.

Known failures are recorded with severity and workaround. A critical auth/ownership/data-loss issue blocks even an educational deployment.

## 24. Docker, migrations, and Darkube delivery

One multi-stage Dockerfile builds a non-root standalone Next.js image containing Prisma client, migrations, web server, and worker code. Runtime commands:

```text
web:     node server.js
worker:  node dist/worker.js   # exact build output decided in initialization spike
migrate: prisma migrate deploy
```

Do not run migrations in every web/worker startup. Release procedure:

1. GitHub Actions passes.
2. Darkube builds the committed Dockerfile through Git integration.
3. Operator reviews/backs up when appropriate and runs one explicit migration job/command.
4. Deploy web with manually approved trigger initially.
5. Verify readiness and smoke tests; enable worker only if optional features are configured.
6. Roll back application image when safe. Database rollback uses forward corrective migrations; never destructive reset.

Darkube **Requires Verification**: Git provider connection, manual approval/trigger behavior, automatic `main` deployment, separate command per app, internal non-public worker, secrets, probe configuration, logs/alerts, replica scaling, one-off migration execution, rollback to previous build, outbound IPv4/IPv6, and resource/pricing limits. Do not claim a capability until tested in the owner's account.

Secrets include database runtime/migration URLs, Better Auth secret/base URL, Supabase project URL/server storage credential, AI key/model, and optional feature flags. They live in Darkube secret variables and local ignored `.env`; never in Git or client-prefixed variables.

## 25. Environments and migration workflow

- Local: Docker PostgreSQL, local/fake storage for ordinary work, mocked AI, development Better Auth secret.
- Test: isolated disposable database per suite/worker; no deployed credentials.
- Deployed MVP: one Supabase Free project.
- Optional staging/integration: second Free project, created only when needed; limits must be reverified. Destructive tests are allowed only with explicit staging guard variables and project-ID assertion.

Schema changes: edit Prisma schema plus any required SQL constraint; create named migration locally; inspect SQL; test from empty and representative previous schema; commit schema/migration together; CI applies to disposable DB; deploy explicitly before compatible code. Never use `db push`, `migrate reset`, or destructive SQL against deployed MVP.

Nutrition seed is separate and idempotent by catalog version. Production seeding never creates default users/passwords.

### 25.1 Dependency inventory and compatibility policy

Exact versions are selected and locked during foundation work, not guessed in this document.

| Dependency/category                    | Purpose                                                | Required?                      | Policy                                                                                                       |
| -------------------------------------- | ------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Next.js, React, TypeScript             | application/runtime/types                              | Yes                            | Upgrade boilerplate to mutually supported patched versions; consult installed Next docs.                     |
| Prisma client/CLI                      | PostgreSQL access and migrations                       | Yes                            | Keep client/CLI identical; verify Supabase pooler and Better Auth adapter.                                   |
| Better Auth and Prisma adapter/plugins | identity/session/username integration                  | Yes, preferred pending spike   | Pin exact version; review migrations/changelog before upgrades.                                              |
| `next-intl`                            | messages, locale routing, server/client locale context | Yes                            | Verify pinned Next.js App Router compatibility.                                                              |
| Zod, React Hook Form/resolver          | boundary validation/forms                              | Yes                            | Server remains authoritative; bound collection sizes.                                                        |
| Tailwind, Radix/shadcn source, Lucide  | UI/accessibility                                       | Yes                            | App imports locally owned primitives; avoid duplicate component libraries.                                   |
| Supabase JS/storage client             | signed private storage operations only                 | Yes                            | Server-only privileged client; do not use database/PostgREST from browser.                                   |
| Image processing library               | metadata stripping/re-encoding                         | Recommended after memory spike | Prefer maintained native package; pin patched binary and test Docker runtime.                                |
| PostgreSQL job helper/library          | queue mechanics                                        | Optional                       | Prefer small in-repo SQL/service contract; add a library only if it reduces tested complexity without Redis. |
| AI provider SDK                        | optional provider adapter                              | Optional                       | Prefer standard `fetch` if official SDK adds little; server-only and independently replaceable.              |
| Vitest, Playwright, test factories     | test layers                                            | Yes                            | Pin compatible versions; browsers installed only in test/CI stages.                                          |
| Pino or equivalent                     | structured logging                                     | Yes                            | Redaction tests required.                                                                                    |

Avoid adding a client state framework, generic repository framework, API client generator, Redis client, service worker package, charting suite, or analytics SDK without a documented requirement. Renovate may propose updates, but automerge is allowed only for changes that pass all gates and do not cross framework/database/auth major versions.

## 26. Implementation sequence

1. **Foundation:** safely adopt boilerplate, patch dependencies, add ADRs, `next-intl`, local PostgreSQL, CI, Docker, environment validation.
2. **Identity:** Better Auth spike, registration/login, throttles, recovery code, sessions, localized auth UI.
3. **Manual vertical slice:** onboarding → manual plan → curated/manual food → confirmed meal → Today/history.
4. **Domain completion:** plan versions/corrections, saved meals, completeness/slots, weights, deterministic reflections, settings, export/deletion.
5. **Storage:** private temporary uploads, signed access, validation, cleanup lifecycle.
6. **Optional worker and AI:** durable jobs, plan extraction, meal recognition, AI reflection, quotas/consent/fallbacks.
7. **Hardening:** owner-isolation suite, bilingual E2E, accessibility/mobile performance, Darkube deployment verification, documentation.

Do not begin optional AI work before the manual vertical slice passes end to end.

## 27. Architecture decision register

| ID      | Decision                                             | Class              | Rationale/implication                                              |
| ------- | ---------------------------------------------------- | ------------------ | ------------------------------------------------------------------ |
| ADR-001 | Modular monolith and boilerplate service boundaries  | Confirmed          | Lowest complexity; testable domain services.                       |
| ADR-002 | Darkube web hosting; Supabase Free DB/storage        | Confirmed          | Near-zero cost; external latency/quotas and pause risk accepted.   |
| ADR-003 | Better Auth embedded behind `IdentityService`        | Preferred/verify   | Avoid custom auth; requires compatibility/security spike.          |
| ADR-004 | Public username/password and recovery code           | Confirmed          | No email dependency; loss of both credentials is unrecoverable.    |
| ADR-005 | Server-only Prisma ownership; defer custom RLS       | Confirmed          | Straightforward MVP isolation; requires disciplined queries/tests. |
| ADR-006 | `next-intl`, locale-prefixed routes                  | Confirmed          | Runtime bilingual RTL/LTR in one app.                              |
| ADR-007 | Hybrid Server Actions/Route Handlers                 | Confirmed          | Aligns with Next.js and avoids unnecessary public API.             |
| ADR-008 | Local versioned nutrition seed                       | Confirmed          | Deterministic, low-cost, Iran-focused; limited initial coverage.   |
| ADR-009 | Optional PostgreSQL worker, no Redis                 | Confirmed          | Durable optional AI jobs with minimal infrastructure.              |
| ADR-010 | Three AI features optional/feature-flagged           | Confirmed override | Core works without credentials/cost.                               |
| ADR-011 | Temporary private media and post-confirm deletion    | Confirmed          | Privacy and Free-tier capacity.                                    |
| ADR-012 | Online-only; no service worker/push                  | Confirmed override | Avoid offline/notification complexity.                             |
| ADR-013 | Immediate irreversible account deletion              | Confirmed override | Simple privacy-conscious lifecycle.                                |
| ADR-014 | Best-effort backup/recovery                          | Confirmed override | Educational/cost priority; not production SLA.                     |
| ADR-015 | GitHub CI; Darkube Git build with gradual deployment | Confirmed/verify   | Simple learning workflow; platform triggers must be tested.        |

## 28. Technical risk register

| Risk                                  | Likelihood/impact    | MVP mitigation                                                      | Future production                              |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| Supabase Free pause/quota exhaustion  | Medium/High          | usage warnings, temporary media, maintenance state                  | paid plan/alternative provider                 |
| No guaranteed backup/PITR             | Medium/High          | best-effort export and local restore exercise; disclose             | automated offsite backups/PITR                 |
| Darkube↔Supabase latency/connectivity | Unknown/High         | deployment spike; pool/timeouts; fail clearly                       | regional provider/private network              |
| Better Auth compatibility gap         | Low–Medium/High      | spike before domain implementation                                  | pin/upgrade plan or owner-approved alternative |
| Owner query omitted                   | Medium/Critical      | service conventions, compound keys, adversarial tests               | RLS defense in depth/security review           |
| Public registration abuse             | Medium/Medium        | basic persistent limits and validation                              | CAPTCHA/reputation/WAF/email verification      |
| Recovery code loss                    | Medium/High for user | prominent save/confirm/regenerate UX                                | verified recovery channel/passkeys             |
| AI privacy/cost/unreliability         | Medium/Medium        | disabled by default, consent, quotas, manual fallback               | contracts/evaluation/monitoring                |
| Nutrition inaccuracies/coverage       | Medium/Medium        | sourced small catalog, provenance, manual correction                | licensed broader dataset/review                |
| Job stuck/duplicate                   | Medium/Medium        | leases, idempotency, retries, revision checks                       | dashboards/dead-letter operations              |
| Private media leak                    | Low/High             | private buckets, server authorization, signed URLs, short retention | independent security test/malware scan         |
| Product/design source conflicts       | High/Medium          | explicit section 1.2 overrides and traceability                     | update source docs in separate approved task   |

## 29. Requirements traceability

| Requirement/journey group                  | Technical owners                                        | Primary verification                                                                          |
| ------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A01–A02, J01–J02 authentication/onboarding | Identity/Profile services, `next-intl` routes           | bilingual E2E, recovery/security tests                                                        |
| O06–O08, P01–P04, J03/J04/J13              | Plan service, immutable snapshots, timeline transaction | unit + DB integration + E2E                                                                   |
| M01–M05, J05–J10                           | Meal/Nutrition/Day services                             | calculation/idempotency/revision tests                                                        |
| T01/H01–H04                                | summaries, reflections, weights                         | service + responsive E2E                                                                      |
| J14 localization                           | `next-intl`, date/digit utilities                       | key parity, RTL/LTR and round-trip tests                                                      |
| J15/J16 reflections/consent                | deterministic engine, optional AI jobs                  | no-consent/no-provider/failure tests                                                          |
| J17 export                                 | Export service, signed private download                 | ownership/expiry/E2E                                                                          |
| J18/S07 deletion                           | Account service, identity revocation, media cleanup     | partial-failure and session tests                                                             |
| J19 AI images                              | Media, Job, AI adapters, editable drafts                | feature-disabled + mocked optional E2E                                                        |
| J20 outages                                | error boundaries, retained drafts, fallbacks            | injected network/provider failure tests                                                       |
| Product acceptance 1–32                    | corresponding services above                            | acceptance matrix maintained in test docs; AI availability clauses interpreted by section 1.2 |

## 30. Implementation readiness checklist

### Ready before coding

- [ ] Owner accepts this specification and its explicit overrides.
- [ ] Boilerplate upstream commit recorded; import plan reviewed; setup script not run.
- [ ] Patched compatible dependency baseline selected and audited.
- [ ] Local Docker PostgreSQL and environment template work without secrets in Git.
- [ ] Better Auth compatibility/recovery-extension spike passes.
- [ ] Both locale shells build; RTL lint and dictionary parity run in CI.

### Ready before deployed MVP

- [ ] Supabase Free limits rechecked; project/database role/private bucket configured.
- [ ] Darkube-to-Supabase DNS/TLS/pooler/storage latency tested.
- [ ] Explicit Prisma migration procedure rehearsed.
- [ ] Core bilingual E2E and cross-account isolation suite pass.
- [ ] Nutrition seed sources/licenses reviewed; no invented values.
- [ ] Account deletion and media cleanup tested.
- [ ] Darkube secrets, probes, manual deploy, logs, and rollback verified.
- [ ] Known educational limitations displayed/documented.

### Ready before enabling AI

- [ ] Worker heartbeat and retry/idempotency tests pass.
- [ ] Provider/model capabilities, retention, connectivity, and cost tested with the actual account.
- [ ] Consent copy names each enabled purpose.
- [ ] Quotas and global kill switch configured.
- [ ] Persian/English/mixed plan and meal image evaluation reviewed.
- [ ] Manual/deterministic fallbacks pass with provider disabled and failing.

## 31. Future production hardening

Before representing Dietyaar as a production health-adjacent service: paid/HA data services; automated offsite backups and tested RPO/RTO; no inactivity pause; legal/privacy review and processor agreements; RLS or equivalent defense in depth; verified recovery channel/passkeys; advanced abuse controls; centralized observability and alerting; vulnerability/container scanning; formal incident response; malware scanning; provider SLAs; load testing; nutrition licensing/review; optional web push/service worker; and updated product/design sources reflecting all approved changes.

## 32. External verification checklist

- **Supabase:** current Free quotas, pause/restore behavior, region, pooler endpoints, Prisma migration compatibility, custom DB role permissions, private signed uploads/downloads, object lifecycle support, service-key scope, logs, and data deletion behavior.
- **Darkube:** Git integration, manual/automatic triggers, Docker build, secret handling, one-off migration command, separate worker command, probes, outbound networking, logs/alerts, rollback, replicas, and pricing.
- **Better Auth:** pinned release, username plugin/model, Prisma adapter transactions/migrations, session revocation, secure proxy cookies, rate-limit integration, and safe password/recovery extension APIs.
- **DeepSeek:** chosen model image and structured-output capability, Persian quality, terms/retention, latency, quotas, and connectivity.
- **Nutrition sources:** license/permission, measurement basis, Iranian-food relevance, and citation completeness.

Until a verification item passes, the specification describes the intended boundary and fallback—not a vendor capability claim.

## 33. Specification audit and gap closure

| Area                    | Pre-audit state   | Gap closed in 1.1-draft                                                                                               | Residual status                                     |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Governance/traceability | Partially covered | Added revision policy, glossary, audit record, stronger release traceability                                          | Complete for MVP                                    |
| Architecture/deployment | Mostly complete   | Added execution/trust-boundary paths and degraded behavior                                                            | Darkube capabilities require verification           |
| Repository/modules      | Mostly complete   | Added module ownership/public operations and transaction rules                                                        | Complete for MVP                                    |
| Data/database           | Partially covered | Added entities, physical types, constraints, indexes, retention, plan rules, AI/throttle/idempotency/deletion records | Prisma SQL remains implementation work              |
| Auth/security/privacy   | Mostly complete   | Added security acceptance, persistent throttle schema, recovery/deletion precision and adversarial tests              | Better Auth/Darkube proxy require verification      |
| Business rules          | Mostly complete   | Added portion, substitution, unsupported instruction, undo, freshness, export, and transaction contracts              | Complete against approved scope                     |
| AI                      | Mostly complete   | Added analysis record, error taxonomy, result/privacy contract                                                        | Provider capability requires verification           |
| Jobs/storage            | Mostly complete   | Added claim/lease/recovery contract and storage security cases                                                        | Supabase signed-flow behavior requires verification |
| Performance/capacity    | Partially covered | Added educational planning envelope, resource/query budgets and scaling triggers                                      | Measurements required during implementation         |
| Operations/quality      | Mostly complete   | Added concrete release evidence and blocking criteria                                                                 | Darkube logs/rollback require verification          |
| Dependencies            | Partially covered | Added required/optional inventory and compatibility/update policy                                                     | Exact versions chosen during foundation             |

No audit change alters an approved product or architecture decision. `product-spec.md` and `design-scope.md` remain unchanged; their known conflicts remain explicitly governed by section 1.2.

## 34. External references reviewed

- Boilerplate repository and architecture: <https://github.com/amirmhp98/mhp-nextjs-boilerplate>
- Better Auth email/password, username, session, and plugin documentation: <https://better-auth.com/docs>
- `next-intl` App Router/routing documentation: <https://next-intl.dev/docs>
- Next.js App Router internationalization guidance: <https://nextjs.org/docs/app/building-your-application/routing/internationalization>
- Supabase pricing and current Free quotas: <https://supabase.com/pricing>
- Supabase Free project pausing: <https://supabase.com/docs/guides/platform/free-project-pausing>
- Supabase PostgreSQL connections and pooling: <https://supabase.com/docs/guides/database/connecting-to-postgres>
- Supabase Prisma guidance: <https://supabase.com/docs/guides/database/prisma>
- Supabase private bucket behavior: <https://supabase.com/docs/guides/storage/buckets/fundamentals>
- Supabase production checklist and Free backup limitations: <https://supabase.com/docs/guides/deployment/going-into-prod>

External documentation is time-sensitive. The implementation-readiness checks require revalidation rather than assuming these pages remain unchanged.
