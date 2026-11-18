# Product Specification — Diet Progress Companion

Version: 1.3

Date: 2026-11-16

Status: Product-ready MVP baseline for technical specification; explicit launch dependencies remain open.

Product languages: Persian and English; Persian is the default UI language. The specification remains in English.

Deliverable scope: Product behavior, technical definitions, implementation requirements, and acceptance criteria. This document does not implement the application.

## Revision 1.1 resolved decisions

- Persian-first bilingual behavior, Iran-first examples, and Solar Hijri presentation are required.
- Users may complete onboarding and manually log meals without an active plan.
- Manual plan entry and plan-image extraction ship in MVP; pasted-text plan extraction is deferred.
- Meal logging uses structured manual entry, saved/recent meals, nutrition-dataset lookup, and manual nutrient values. The former deferral of meal-photo analysis is superseded by Revision 1.2; standalone meal-text analysis remains deferred.
- AI consent originally covered plan-image extraction and AI-written morning check-ins. Revision 1.2 adds meal-photo food recognition as a third separately disclosed purpose. Without consent, manual flows remain available and morning check-ins use deterministic localized templates.
- Age is collected once during eligibility. Optional profile height, profile weight, gender, and birth year are offered during onboarding and may all be skipped. Profile weight does not enable weight tracking or create a weight-history entry.

## Revision 1.2 resolved decision

- AI food recognition from a meal photo is required in the MVP. The server uses one configurable approved provider—DeepSeek, GapGPT, or AvalAI—behind a provider-neutral adapter. Recognition produces an editable draft only; nutrition values still come from the nutrition dataset or explicit user input, plan matching remains deterministic or user-confirmed, and nothing affects totals or comparisons before user confirmation.

## Revision 1.3 resolved decision

- Onboarding offers four genuinely optional profile attributes: height, weight, gender, and birth year. A user may provide any subset or skip all four without losing access to onboarding or any manual MVP journey.
- Age remains the authoritative adult-eligibility input. Optional birth year is profile information only and does not silently replace, derive, or overwrite the eligibility decision.
- Optional onboarding weight is a nullable profile measurement, not a `WeightEntry`. It neither enables weight tracking nor creates history; creating the first tracked weight always requires a later explicit user action.

## 1. Product purpose

Help adults following an existing diet understand how their recorded food intake aligns with that plan, receive useful feedback, and start each day with a calm, supportive direction.

The core loop is: import and confirm a plan → record food quickly → review and confirm estimated nutrition → see understandable progress → receive a concise morning reflection.

The application tracks an existing plan. It does not prescribe a diet, diagnose conditions, or promise weight loss. Plan adherence and weight change are separate concepts.

## 2. Decisions and assumptions

These are confirmed MVP product decisions unless a row or later section explicitly identifies an open launch dependency.

| Topic                  | MVP decision                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary persona        | Adult in Iran following a dietitian-provided, meal-based plan for weight loss                                                                                                                                                                                                   |
| Eligible users         | Adults aged 18+ following an existing non-clinical plan for weight loss, maintenance, or weight gain                                                                                                                                                                            |
| Platform               | Responsive web application; mobile-first; installable shell optional                                                                                                                                                                                                            |
| Launch locale          | Iran-first; complete Persian RTL and English LTR interfaces                                                                                                                                                                                                                     |
| Monetization           | No billing or subscription flow in MVP                                                                                                                                                                                                                                          |
| Accounts               | Email one-time-code authentication                                                                                                                                                                                                                                              |
| Plan entry             | Manual structured entry and automatic extraction from one JPEG/PNG/WebP plan image are required; automatic plan extraction from pasted text is deferred                                                                                                                         |
| Plan authorship        | Optional metadata: dietitian, fitness coach, self, or unspecified; no verification or author account                                                                                                                                                                            |
| Supported plan formats | Meal-based, calorie/macro-target-based, custom with explicit meals/rules/targets, or a combination                                                                                                                                                                              |
| PDF plans              | Deferred; tell users to enter the plan manually or upload a screenshot image                                                                                                                                                                                                    |
| Meal entry             | Structured manual entry, manual nutrients, recent meals, saved meals, and required AI food recognition from a meal photo; standalone meal-text analysis is deferred                                                                                                             |
| Morning message        | In-app daily card; optional web push with explicit opt-in                                                                                                                                                                                                                       |
| Notification default   | 08:00 in the user's selected IANA timezone; Asia/Tehran by default                                                                                                                                                                                                              |
| Nutrition              | Energy, protein, carbohydrate, fat; fiber when available                                                                                                                                                                                                                        |
| Units                  | Metric and imperial input; canonical grams, kilograms, and kcal                                                                                                                                                                                                                 |
| AI provider            | One configurable approved provider—DeepSeek, GapGPT, or AvalAI—used server-side for required meal-photo food recognition, plan-image extraction, and consent-based daily writing; the launch provider/model is selected after capability, privacy, latency, and cost validation |
| Design ownership       | [design-scope.md](../design/design-scope.md) owns information architecture, screens, states, and journeys; [visual-design.md](../design/visual-design.md) or approved Figma owns visual tokens, components, layout, and visual direction                                        |

Development can begin with these defaults. Public release requires the launch decisions in section 20.

Default onboarding examples, sample data, and Today-dashboard prioritization use the primary persona. Support for other eligible goals and authors must not add author collaboration, diet generation, or automatic target recommendations.

## 3. Scope

### MVP

- Authentication, onboarding, account recovery, and resumable onboarding.
- Manual structured plan creation, plan image extraction with editable review, explicit activation, and plan versioning.
- Meal drafts, structured manual entry, required AI food recognition from meal photos with editable review, corrections, confirmation, edit, delete, and reuse. Standalone analysis of meal-description text is deferred.
- Deterministic nutrition totals and explainable alignment indicators.
- Today dashboard, date navigation, and compact seven-day history.
- Morning reflection, notification preferences, and scheduled generation.
- Light/dark/system appearance, accessible motion, and responsive layouts.
- Data export, deletion, privacy controls, operational monitoring.

### Deferred

Automatic diet creation, automatic plan extraction from pasted text, standalone automatic analysis of meal-description text, clinical diet management, clinician portals, social feeds, competitive streaks, wearables, barcode scanning, voice entry, meal delivery, exercise-calorie compensation, detailed micronutrient reports, and payment flows.

No open-ended AI chat is required. No social comparison or punitive gamification.

## 4. Product principles

1. A meal should be quick to record and easy to correct.
2. AI suggests; the user confirms; application code calculates.
3. Missing data stays unknown.
4. Every displayed insight must have an understandable basis.
5. Show one useful next step instead of many charts.
6. Use supportive language without labeling foods or people as good or bad.
7. Make estimate uncertainty visible without repeatedly interrupting the user.

## 5. Key definitions

| Term               | Definition                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan version       | Immutable snapshot of confirmed meals, targets, schedule, and effective dates                                                                                      |
| Planned slot       | A meal or snack expected on a particular local date                                                                                                                |
| Meal draft         | Unconfirmed input and estimates; excluded from totals                                                                                                              |
| Confirmed meal     | User-approved record included in calculations                                                                                                                      |
| Logged intake      | Sum of confirmed meal nutrients for the selected date                                                                                                              |
| Complete day       | User explicitly states that all intake for that date has been recorded                                                                                             |
| Partial day        | Logging remains incomplete or is not explicitly closed                                                                                                             |
| Alignment          | Comparison with confirmed plan rules; not a medical health rating                                                                                                  |
| Unknown nutrient   | Missing value, stored as null; never silently converted to zero                                                                                                    |
| Estimate source    | Nutrition database record, user label/manual value, or unknown                                                                                                     |
| Morning reflection | A short daily check-in based on yesterday's available records and today's plan; AI-written with consent, otherwise produced from deterministic localized templates |

## 6. Onboarding

Use a short sequence of focused screens with progress, Back, automatic server-side save, and clear explanations. Avoid a single long form.

1. **Welcome:** Explain the purpose and that food estimates require review.
2. **Eligibility and consent:** Email code; age required for eligibility; privacy notice; and one optional, withdrawable AI-processing consent that separately describes its three purposes: sending a user-selected plan image for extraction, sending a user-selected meal photo for food recognition, and sending an allowlisted structured daily summary for AI-written morning check-ins. Declining consent disables both image features and uses deterministic morning check-ins, while all manual plan and meal flows remain available. Allow the user to switch between Persian and English during onboarding and remember the choice.
3. **Basics and optional personal information:** Preferred name optional; preferred unit system; optional height, weight, gender, and birth year; Back/Edit eligibility link. Do not collect age again. Label each personal attribute optional and provide an unpressured Skip or Continue action.
4. **Context:** Goal of losing, maintaining, or gaining weight; optional plan authorship metadata; optional dietary preferences and allergies. Avoid collecting full medical histories.
5. **Plan:** Enter the existing diet manually or photograph/upload an image of it. Pasted-text extraction is not available.
6. **Review:** Correct parsed days, meal slots, portions, alternatives, and numeric targets.
7. **Preferences:** Timezone confirmation, morning-message time, appearance. Push permission requested only after an explanation and an explicit choice.
8. **First action:** Open Today and offer “Log your first meal.”

Requirements:

- Age is collected without requiring a date of birth and remains the authoritative eligibility value. Under-18 users cannot activate this MVP.
- Birth year is optional and does not require a full birth date. Persian UI defaults to a Jalali year experience and Persian numerals; English UI defaults to a Gregorian year experience. Persist the integer year together with its `jalali` or `gregorian` calendar, because a year without month/day cannot be losslessly converted between calendars. A locale switch preserves and labels the original calendar/value rather than silently converting it. If an entered birth year is future/invalid or materially conflicts with the eligibility age after allowing for year-only uncertainty, ask the user to correct or skip it; never silently change eligibility.
- Optional profile height and weight accept the user's selected metric or imperial presentation and persist canonical centimeters and kilograms. Entered measurements must be positive and unit-labeled; invalid values receive field feedback, while unusual but possible values receive a clarification prompt rather than a clinical judgment. Exact validation thresholds are an implementation validation policy and must not be presented as health guidance.
- Gender is optional and supports respectful inclusive choices: woman, man, non-binary, self-described, and prefer not to say. Self-described text is optional, bounded free text. Localized labels may be copy-reviewed without changing the canonical values.
- All four attributes are private, owner-scoped, editable later, preserved across Back/refresh/resume, and nullable. Missing values do not produce validation errors or block completion.
- Weight tracking remains separately opt-in and is not required for onboarding, meal logging, plan activation, or comparison. Onboarding profile weight does not enable tracking and does not create a `WeightEntry`. After the user explicitly enables tracking, the product may offer the profile weight as a prefill, but creates the first history entry only after separate confirmation.
- Users may save onboarding without a plan, but alignment remains unavailable until a plan is activated.
- Users may also finish onboarding, enter Today, and manually log meals without an active plan. Today shows logged meals and a prominent Add a plan action; plan matching and numeric plan comparisons remain unavailable until an eligible plan is activated.
- An ineligible clinical plan may be retained only as an inactive draft if permitted by the data-retention policy; it cannot activate or enable comparisons.
- Users can revise profile information later.
- Persian is the default for new users. Language remains available in Settings and changes interface presentation without translating or replacing user-entered plan and meal text.
- Numeric inputs accept Persian, Arabic-Indic, and Latin digits and normalize them before validation and storage.
- The Persian interface displays Persian numerals and Solar Hijri dates. The English interface displays localized LTR dates. API and persistence contracts continue to use Gregorian ISO dates and UTC instants where specified.
- Default the timezone to Asia/Tehran. Users can confirm or change it during onboarding.
- Do not use height, profile weight, gender, birth year, or tracked weight to generate BMR/TDEE, nutrition targets, plan changes, or eligibility decisions. Do not infer sex from gender.
- Plan import does not activate a plan until the user confirms it.
- If the user identifies the plan as prescribed to manage a medical condition, prevent activation and explain the MVP limitation. A dietitian-authored general weight-management plan remains eligible. If the user indicates pregnancy/breastfeeding or requests condition-specific nutrition advice, avoid clinical coaching and do not collect detailed diagnoses.

## 7. Plan import and representation

### Inputs

Manual structured plan entry and review must work in Persian and English at launch, including Persian, English, or mixed-language names and notes. Support one JPEG/PNG/WebP plan image up to 10 MB for automatic extraction. Reject unsupported files with actionable guidance, preserve any retained sanitized source according to the media policy, and keep extraction output as a draft until the user reviews and confirms it. Automatic plan extraction from pasted text is deferred and has no launch UI or API requirement.

### Plan image extraction

This subsection is required for launch and applies only to plan images. It does not apply to pasted-text plan extraction, which is deferred.

Extract, when present:

- Title and source note.
- Daily or weekday schedule.
- Meal slots and optional preferred times.
- Foods, portions, units, alternative groups, and explicit substitutions.
- Daily/meal energy and macro targets.
- Rule type: minimum, maximum, or range; unit; source text.
- Ambiguities and fields requiring confirmation.

Plan authorship is optional metadata and is not verified. Activation depends on eligible non-clinical purpose and supported structure, not on who authored the plan. The plan may be meal-based, calorie/macro-target-based, custom with explicit meals, rules, or targets, or a combination. Use targets and substitutions only when stated in the plan or explicitly confirmed by the user.

Show source text alongside the review where useful. Never invent missing targets, portions, or substitution equivalence. An ambiguous item receives a question or remains unresolved. Users can activate a qualitative plan without numeric targets; unavailable comparisons are hidden.

### Scheduling and changes

- Support one repeating daily template or a seven-day schedule.
- Map weekdays using the user's timezone.
- Only one plan version can be active for a date; reject overlapping effective periods.
- A user's first activated plan defaults to the current local date so meals logged immediately after activation can use its slots and rules.
- A replacement plan or new version defaults to the next local date, closing the previous version at the end of the current local date.
- The user may explicitly choose a different effective date for either case. Validate the complete version timeline before activation, show the historical impact, and reject unresolved overlaps. A past effective date is treated as a historical correction and requires the audit and recomputation behavior below.
- Historical meal records retain the version applicable to their date.
- A user can explicitly correct a past plan date; retain an audit event and recompute affected summaries.
- If no plan applies to a date, show the intake log without alignment.

## 8. Meal logging

### Primary flow

1. Tap the persistent “Log meal” action.
2. Choose a saved/recent meal, structured manual entry, or photograph/upload a meal for AI food recognition.
3. Set date/time and meal type; default to now in the selected timezone.
4. For a photo, upload privately and run the configured AI provider to propose food identities, preparation assumptions, and portion candidates. Clearly label uncertain or unresolved results.
5. Resolve recognized or manually selected foods against the nutrition dataset and calculate nutrients; keep the draft editable during recognition, lookup, and calculation. AI recognition is not itself a nutrient source.
6. Review food items, quantities, nutrient sources, preparation notes, assumptions, and unknown fields.
7. Correct or remove items; confirm portion and intended planned slot.
8. Tap “Confirm meal.”
9. Save atomically, recalculate totals, and show a small confirmation with Undo.

### Review behavior

- Allow the user to add multiple editable food line items and optional preparation notes.
- Prefer grams with household measures when a supported conversion exists.
- Missing portion information must be resolved through user entry or explicit acceptance of a labeled database/portion-conversion estimate.
- Nutrient amounts are editable; manual label values can override database-derived values before confirmation.
- Unknown values remain visibly unknown.
- Users can record a meal with incomplete nutrition; relevant daily totals become “at least” known totals and comparisons affected by missing values are unavailable.
- Plan-image AI failure never prevents manual plan or meal entry.
- Saving a recent meal creates a new editable snapshot; later edits do not change the original.

### Edits and edge cases

- Multiple actual meals can contribute to one planned slot; unplanned snacks still count in intake.
- A meal can link to only one planned slot. Splitting it requires an explicit user action.
- Diet deviations remain recordable; never block food logging because an item differs from the plan.
- Past dates can be edited; future consumed timestamps are rejected.
- A late-night meal defaults to its calendar date but the user can select another date explicitly.
- Duplicate meal submission protection uses an idempotency key and never creates a second meal from a repeated confirmation request.
- On failed save, retain the draft and show Retry. Do not display success before server confirmation.
- MVP is online-first. Maintain a session draft across navigation; avoid persistent unencrypted offline health records.
- Undo deletion is available for 10 seconds before final server deletion; committed deletes recompute summaries.

## 9. Nutrition estimation

Separate food selection from calculation:

1. The user enters or selects a structured food item and consumed quantity.
2. A server nutrition adapter resolves identifiable foods against a versioned nutrition dataset.
3. Application code scales per-100-g values using the confirmed consumed quantity.
4. Unresolved foods use user-entered label values or remain unknown; the MVP does not generate AI-only meal estimates.
5. User approval produces a frozen nutrient snapshot.

The MVP must ship a documented, licensed nutrition dataset or connected provider. Exact provider and launch-region coverage are release decisions. Database matches must remain editable before confirmation and must not be represented as exact when the consumed food or portion is uncertain.

Store source IDs, source version, nutrient basis, portion conversion, estimation method, and user overrides. Keep decimal precision internally; round only for display. Energy from the source is authoritative; macro-derived energy can flag a potential inconsistency but must not silently overwrite it.

## 10. Alignment logic

Avoid a single opaque “diet score” in MVP. Show logging completeness, meal-plan matches, and numeric target comparisons separately.

### Logging completeness

- Planned slots have states: not recorded, recorded, explicitly skipped.
- “Not recorded” means unknown, never failure.
- A skipped slot is an explicit user statement, distinct from an incomplete log.
- Completing planned slots does not prove all food was logged; provide “I've logged everything for today.”
- Adding/editing a meal after day completion reopens the day and asks the user to reconfirm completeness.

### Meal-plan match

Compare confirmed food/portion data with the linked slot's confirmed rules.

- **Matches plan:** Fits a listed option and its confirmed portion/range.
- **Adjusted:** User explicitly identifies an alternative or portion change.
- **Needs review:** Insufficient information or no confirmed mapping.
- **Skipped:** User explicitly marks the planned slot skipped.

Application code may identify an exact deterministic match when confirmed food and portion data satisfy a plan rule. Ambiguous alternatives or substitutions remain Needs review until the user explicitly confirms the mapping; no AI-proposed mapping exists in MVP. These labels describe plan matching, not food quality. Display a sentence explaining the result; no hidden weights.

### Numeric targets

For each confirmed target, let x be known confirmed intake and [L,U] the plan range:

- x < L: “Below planned range” only for a complete day.
- L <= x <= U: “Within planned range” for a complete day.
- x > U: “Above planned range,” even on a partial day, only if the nutrient total is sufficiently known; if some values are missing, say “Known intake is already above the range.”
- Partial day below U: show intake and plan range, without a final verdict.
- Minimum-only and maximum-only rules evaluate their stated bound.
- A single numeric target has no inferred tolerance: display x / target and signed difference. During plan review, the user may explicitly define a range.
- No numeric target: do not fabricate one.
- Missing nutrient values: do not claim within-range or below-range alignment.
- Never clamp the displayed percentage at 100% or use a progress ring implying that less food is always better.

Example: a confirmed 1,800–2,000 kcal range and complete intake of 1,900 kcal yields “Within planned range.” An incomplete log of 900 kcal yields “900 kcal logged · Day not complete,” not “Poor adherence.”

Seven-day history shows daily completeness and comparisons only where evaluable. Do not average incomplete days into an adherence percentage.

## 11. Today dashboard and navigation

Primary navigation contains Today, History, Plan, and Settings. Mobile presents all four as primary destinations; desktop presents the same four in persistent side navigation. Logging remains a distinct prominent action throughout and is not a fifth navigation destination.

Above the fold on mobile:

1. Date and compact morning reflection, collapsible after reading.
2. One status card: logged energy versus confirmed range when available; completeness label; protein/carbohydrate/fat in a compact expandable row.
3. One contextual next action: next planned slot, finish a draft, or review today's log.
4. Prominent “Log meal” action.

Below:

- Chronological meal list with time, short title, nutrient-source label when useful, and edit access.
- Planned slots not yet recorded, shown neutrally.
- “I've logged everything for today.”

Do not add default water trackers, exercise widgets, BMI gauges, leaderboards, or unrelated graphs. History uses a simple seven-day list and date picker; users can open any saved date. Optional weight entries appear in History with a compact trend only after multiple entries. Never attribute weight change to a single meal.

Empty states distinguish no plan, no meals, no targets, pending plan-image extraction, unavailable nutrition lookup, and unavailable service.

## 12. Morning reflection and delivery

Generate one localized daily check-in in the user's selected interface language per user/local date, at the configured time, after onboarding and plan activation. When AI-processing consent is active, generate a 60–100-word AI-written paragraph. Without active AI consent, generate a concise deterministic message from approved localized templates and server-calculated facts. Persian output must be natural Persian rather than transliterated English. Switching the interface language does not silently rewrite a reflection already generated for that date.

Input is a server-produced structured summary: yesterday's completeness, confirmed intake, evaluable plan comparisons, uncertain data, today's applicable plan, and the user's preferred name if provided. Do not send the full profile or all historic photos.

AI consent controls only the generation method, not whether the in-app daily check-in exists. Deterministic generation runs entirely in application code, makes no AI-provider request, uses only allowlisted structured fields from the server summary, and must never infer or invent an observation. If no supported observation exists, use an approved no-data template. Withdrawing consent affects the next generation and any queued AI job; it does not rewrite already generated messages.

The paragraph should:

- Acknowledge one grounded observation from yesterday.
- Explicitly qualify incomplete records.
- Suggest one small action consistent with today's confirmed plan.
- Finish with calm encouragement.
- Avoid diagnosis, guilt, compensatory restriction, promises, invented facts, or generic excessive praise.
- Never recommend skipping meals or changing prescribed targets.

Example for incomplete data: “You recorded lunch yesterday, so we have a starting point, though not a full picture of the day. Today, try logging breakfast when you finish it and checking the portion before you save. Your plan is here to guide you, and each clear record makes the feedback more useful.”

Delivery:

- In-app card is required; push is optional and separately permissioned.
- Push text is generic: “Your daily check-in is ready.” No sensitive nutrition on the lock screen.
- Unsupported or denied push does not prevent in-app delivery.
- No email delivery in MVP.
- If generation fails, use a factual template; never leave an endless loading state.
- Record generation method as `ai`, `deterministic_no_consent`, or `deterministic_fallback`. The same uniqueness, scheduling, revision, localization, and notification rules apply to every method.
- Unique key: user ID + local date + message type.
- Job dispatch runs at least every five minutes; generation target is within 15 minutes of the selected time.
- Retries are bounded; duplicate messages/notifications are prevented.
- Messages record the data revision they used. Late edits mark the reflection as based on an earlier snapshot; deterministic dashboard data updates immediately.
- Timezone changes affect future schedules and must not create two morning messages for the same selected local date.
- Daylight-saving transitions use the first valid occurrence of the configured local time.

## 13. UX, copy, and visual requirements

- All product copy is available in Persian and English and is concise, warm, professional, and non-judgmental.
- Persian layouts use complete RTL behavior and English layouts use LTR behavior. Mixed-direction user content must remain readable without changing the stored source text.
- Localize validation messages, onboarding, Today, History, Plan, Settings, progress feedback, empty states, errors, and accessibility labels in both languages.
- Use familiar Iranian foods and household portions in default onboarding examples, fixtures, and sample data.
- Prefer “Review estimate,” “Confirm meal,” and “Day not complete.”
- Avoid “cheat meal,” “failed,” “burn it off,” and red punishment states.
- One primary action per screen; progressive disclosure for detailed nutrients and provenance.
- Mobile viewport support from 320 px; no horizontal scrolling for core tasks.
- Touch targets at least 44 × 44 CSS px.
- Keyboard navigation, visible focus, accessible names, screen-reader status announcements, and WCAG 2.2 AA target.
- Light, dark, and system mode; persist preference; prevent theme flash.
- Use short transitions (roughly 150–250 ms), preserve focus, and honor reduced motion. Animation never blocks saving or navigation.
- Skeletons for loading, clear timeout states, and confirmation after durable saves.
- [design-scope.md](../design/design-scope.md) owns information architecture, pages and sheets, screen-level data/actions, UI states, and user journeys.
- design.md or the approved Figma file owns palette, typography, spacing, radii, components, responsive layout details, and motion tokens. Until one is supplied, neutral accessible temporary tokens are formally approved for technical specification work, infrastructure, and implementation; do not present them as the final brand.
- Product behavior takes priority over decorative dashboard elements proposed in a visual source.

## 14. Proposed technical architecture

These are implementation choices, not vendor capability claims. Resolve stable package versions at project initialization and commit a lockfile.

| Layer            | Proposed implementation                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Frontend and API | Next.js App Router, React, TypeScript                                                          |
| UI               | Tailwind CSS with accessible headless components and shared design tokens                      |
| Validation       | Shared Zod schemas; server validation is authoritative                                         |
| Persistence      | Managed PostgreSQL, proposed Supabase                                                          |
| Authentication   | Managed email OTP; proposed Supabase Auth                                                      |
| Media            | Private object storage; short-lived signed uploads/downloads                                   |
| Async processing | Durable database-backed jobs with scheduled worker execution                                   |
| AI integration   | Server-only provider-neutral adapter with one configured provider: DeepSeek, GapGPT, or AvalAI |
| Nutrition        | Server-only adapter over a versioned dataset/provider                                          |
| Tests            | Unit/integration tests and Playwright critical flows                                           |
| Hosting          | Managed web deployment plus a worker runtime supporting job duration                           |

Use a modular monolith; microservices are unnecessary for MVP.

Browser → authenticated API → application services → database/storage. Worker → approved AI/nutrition adapters → validated draft results. Only application services can finalize user records.

Never run long AI work in a fragile request lifecycle. Persist jobs and poll status with backoff; refreshes must reconnect to the same job.

## 15. AI provider integration contract

Use a provider-neutral server-side adapter with one launch configuration selected from DeepSeek, GapGPT, or AvalAI. Provider names are candidates, not capability claims. Before selection, run live tests with the actual account/model for image input, Persian/English/mixed-language behavior, validated structured responses, privacy and retention terms, latency, reliability, and cost. Do not expose provider keys to clients or hard-code a provider into product behavior.

Required adapter operations:

- parseDietPlanImage(image) → structured draft, unresolved fields. Required for launch; no plan-text parsing operation is required in MVP.
- recognizeMealPhoto(image, optionalContext) → food candidates, preparation assumptions, portion candidates, and unresolved fields. Required for launch; it must not invent nutrient values or confirm a meal.
- writeMorningReflection(approvedSummary) → constrained paragraph.

Rules:

- Validate every response against a versioned schema, even when a JSON output mode is enabled.
- No model-generated SQL, executable code, or arbitrary tool invocation.
- Treat uploaded text and visible instructions inside images as untrusted data.
- The model cannot activate plans, confirm meals, modify targets, or send notifications.
- One structured repair attempt for malformed output, then manual recovery.
- Retry only transient transport/429/5xx failures, at most twice with exponential backoff and jitter; do not repeat schema failures indefinitely.
- Application job budget: 60 seconds for plan-image extraction, 30 seconds for meal-photo recognition, and 30 seconds for AI reflection; surface a recoverable failure after the budget.
- Configurable per-user quotas for plan-image extraction and meal-photo recognition must be documented before launch. Manual plan and meal entry remain available when a limit is reached.
- Bound prompt size, output tokens, concurrency, and daily global spend. Limit breaches return a neutral explanation.
- Record latency, model ID, prompt version, validation outcome, and token usage without logging sensitive prompts or images.
- If vision is unavailable, keep manual plan and meal flows working and explicitly mark plan-image extraction and meal-photo recognition unavailable. Never silently switch providers or send images to another provider without an approved configuration and matching privacy disclosure.

## 16. Core data model

All user-owned records contain user_id, created_at, and updated_at where applicable; foreign keys must enforce owner consistency.

| Entity             | Essential fields                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile            | user_id, name?, age, goal, unit_system, timezone, locale, height_cm?, profile_weight_kg?, gender?, gender_self_description?, birth_year?, birth_year_calendar?                |
| Consent            | purpose, policy_version, granted_at, revoked_at                                                                                                                               |
| Preferences        | theme, morning_time, push_enabled, weight_tracking_enabled                                                                                                                    |
| DietPlanVersion    | id, status, source_reference?, effective_from, effective_to?, original_text?, schema_version                                                                                  |
| PlanDay            | plan_version_id, weekday or daily-template marker                                                                                                                             |
| PlanSlot           | plan_day_id, label, preferred_time?, food_options, portion_rules                                                                                                              |
| PlanTarget         | scope, nutrient, rule_type, lower?, upper?, exact?, unit, source_text                                                                                                         |
| Meal               | id, consumed_at_utc, local_date, timezone_at_entry, plan_version_id?, slot_id?, status, revision                                                                              |
| MealItem           | meal_id, name, grams?, household_quantity?, nutrients, source, source_id?, source_version?, preparation_notes?, portion_conversion?, user_overrides                           |
| SavedMeal          | id, name, item_snapshot, nutrient_snapshot, last_used_at?; edits never mutate confirmed meals created from it                                                                 |
| MediaAsset         | owner, private_path, purpose, mime_type, byte_size, retention_deadline                                                                                                        |
| DayState           | local_date, complete_at?, revision, reopened_at?                                                                                                                              |
| PlanSlotOccurrence | local_date, plan_version_id, slot_id, explicit_state, state_changed_at, revision; persists explicit skipped state while recorded state is derived from linked confirmed meals |
| DailySummary       | local_date, source_revision, known_totals, unknown_counts, comparisons                                                                                                        |
| MorningReflection  | id, local_date, body, source_revision, generated_at, generation_method, notification_status                                                                                   |
| ReflectionFeedback | reflection_id, rating, submitted_at; one current `helpful` or `not_helpful` value per reflection and user                                                                     |
| Job                | type, owner, idempotency_key, state, attempts, next_run_at, safe_error_code                                                                                                   |
| PushSubscription   | endpoint and encrypted provider credentials                                                                                                                                   |
| WeightEntry        | id, measured_at, local_date, weight_kg, revision                                                                                                                              |
| AuditEvent         | actor, action, entity_type, entity_id, timestamp, safe_metadata; no raw sensitive content                                                                                     |

Nutrition object: energy_kcal, protein_g, carbohydrate_g, fat_g, fiber_g; each is a non-negative decimal or null.

Daily summaries are derived caches, never the source of truth. Rebuild from confirmed records and applicable plan versions. Use transactions and revision checks to avoid lost edits.

Saved meals are user-owned reusable snapshots. Creating a meal from one copies its items into a new editable meal draft; later changes in either direction never mutate the other record. A saved meal can be created from a confirmed meal or directly through saved-meal management.

For each planned slot and local date, the displayed state is derived as follows: one or more linked confirmed meals means recorded; otherwise an explicit `skipped` PlanSlotOccurrence means skipped; otherwise it is not recorded. Linking a confirmed meal clears a prior skipped state for that occurrence. Removing the last linked meal returns the occurrence to skipped only if the user explicitly marks it skipped again.

Historical plan correction creates a new immutable correction version or adjusts the version timeline through one audited transaction; it never edits an immutable version in place. The transaction validates ownership and overlap, records the reason and affected date range, increments relevant revisions, and queues recomputation of affected summaries.

Local-date behavior: preserve the explicit recorded local_date when timezone preferences later change. New entries use the new timezone. Store instants in UTC and scheduling zones as IANA identifiers.

Localization behavior: store canonical numeric values independently of display digits. Store application dates in Gregorian ISO form and render Solar Hijri dates in the Persian interface. Preserve original Persian, English, or mixed-language plan and meal text across locale changes. Layout direction follows the selected interface locale, while individual mixed-language fields use direction-aware rendering.

## 17. API and state contracts

Authenticated endpoints; all reads and writes enforce ownership. Return structured errors: code, safe message, field errors, retryable, request ID.

| Route                                    | Purpose                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| GET/PATCH /api/profile                   | Read/update basics and preferences                                                       |
| POST /api/uploads                        | Validate metadata and issue private upload permission                                    |
| POST /api/plan-drafts                    | Create a manual or photo plan draft                                                      |
| POST /api/plan-drafts/:id/analyze        | Enqueue plan image extraction; pasted-text plan extraction is not supported in MVP       |
| PATCH /api/plan-drafts/:id               | Correct a manual or conditionally extracted plan draft                                   |
| POST /api/plan-drafts/:id/activate       | Validate and activate immutable version                                                  |
| GET /api/plan?date=YYYY-MM-DD            | Get applicable plan                                                                      |
| GET /api/plans/versions                  | List current, scheduled, and historical plan versions                                    |
| GET /api/plans/versions/:id              | Read one owned immutable plan version                                                    |
| POST /api/plans/corrections              | Apply an audited past-date correction from a reviewed draft and recompute affected dates |
| POST /api/meal-drafts                    | Create logging draft                                                                     |
| POST /api/meal-drafts/:id/analyze-photo  | Enqueue required meal-photo food recognition and return an editable proposed result      |
| PATCH /api/meal-drafts/:id               | Correct draft                                                                            |
| POST /api/meal-drafts/:id/confirm        | Atomically create confirmed meal                                                         |
| PATCH/DELETE /api/meals/:id              | Revise/delete and invalidate summaries                                                   |
| GET/POST /api/saved-meals                | List/search saved meals or create a reusable snapshot                                    |
| GET/PATCH/DELETE /api/saved-meals/:id    | Read, rename/revise, or delete a saved meal without mutating meal history                |
| POST /api/saved-meals/:id/use            | Copy a saved meal into a new editable meal draft                                         |
| GET /api/days/:date                      | Meals, plan, totals, completeness, reflection                                            |
| PUT /api/days/:date/completeness         | Explicitly complete or reopen day                                                        |
| PUT /api/days/:date/slots/:slotId/state  | Mark an applicable slot skipped or clear its explicit state using revision checks        |
| GET /api/history?from=&to=               | Paginated date summaries                                                                 |
| GET/POST /api/weight-entries             | List entries for a date range or create an entry                                         |
| PATCH/DELETE /api/weight-entries/:id     | Revise or delete an owned weight entry                                                   |
| PUT/DELETE /api/reflections/:id/feedback | Set helpful/not-helpful feedback or remove it                                            |
| GET /api/jobs/:id                        | Safe progress/result status                                                              |
| POST/DELETE /api/push-subscriptions      | Manage opt-in delivery                                                                   |
| POST /api/account/export                 | Produce private JSON/CSV export                                                          |
| DELETE /api/account                      | Reauthenticate and initiate deletion                                                     |

Plan-image draft states: editing → queued → analyzing → ready_for_review → activated. Meal-photo drafts use editing → uploading → queued → recognizing → ready_for_review → confirmed. A failed job returns to an editable draft with Retry and Manual entry. A canceled or superseded job cannot overwrite a newer revision. Activation and meal confirmation require the draft's current revision and an idempotency key.

All mutation endpoints above require revision or conditional-write protection where concurrent edits could lose data. Deletes of saved meals and weight entries are idempotent. Reflection feedback is optional product telemetry linked to the reflection ID and must not include free text or raw nutrition content.

Export/deletion jobs must report completion or a recoverable failure; do not claim instant deletion while data remains active.

## 18. Privacy, security, and reliability

- Collect the minimum data required; never send email, authentication data, or full profile to AI without a documented need.
- Separate processing consent from push consent; withdrawal disables future plan-image extraction, meal-photo recognition, and AI-written check-ins while manual entry remains available and future morning check-ins use deterministic localized templates.
- Encrypt transport and managed storage; keep credentials on the server.
- Enforce row-level isolation plus server authorization; test cross-account access.
- Validate file signatures, MIME, byte/pixel bounds, and decoded content. Re-encode images, strip EXIF, and reject arbitrary URL fetching.
- Source plan images follow the same rule; retain only sanitized copies if the user chooses to keep them.
- Unattached drafts/media expire after seven days. Offer source-image deletion without deleting the structured plan.
- Account deletion removes active records and media within seven days; encrypted backup expiry target is 30 days and must be disclosed.
- Explain that provider-side retention is governed by the contracted AI provider terms; confirm those terms before launch.
- No health payloads in analytics, crash traces, URLs, or push bodies. No advertising trackers in MVP.
- Rate-limit authentication, plan-image extraction, and meal-photo recognition; protect cookie-authenticated mutations against CSRF and apply standard content security controls.
- Daily backups; documented restore procedure with proposed RPO 24 hours and RTO 24 hours.
- Job logs, error alerts, dead-letter review, budget alerts, and a kill switch for AI.
- Jurisdiction, hosting region, processor contracts, and applicable privacy obligations require review before public release; no compliance certification is implied.

## 19. Performance and acceptance criteria

### Performance targets

Measured on representative mid-range mobile devices and a normal 4G connection:

- Core Web Vitals at p75: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1.
- Draft field interactions provide immediate visual feedback.
- Confirmed meal save: p95 <= 1.5 s.
- Plan-image extraction: target p95 <= 20 s excluding upload; measure during prototype testing, not a promised provider SLA.
- Plan-image extraction exceeding its budget shows Retry and manual plan entry.
- Meal-photo recognition: target p95 <= 15 s excluding upload; measure during prototype testing, not a promised provider SLA. Timeout or failure preserves the draft and offers Retry and structured manual entry.
- Saved meal logging usability target: median <= 15 s; structured manual meal flow target <= 45 s, validated in usability sessions.
- No spinner without status or timeout recovery.

### Required acceptance scenarios

1. A user resumes onboarding without losing confirmed steps.
2. Manual or image-extracted plan activation cannot silently add invented targets or unresolved rules.
3. A qualitative plan works without displaying fake numeric targets.
4. Meal nutrients come only from the versioned nutrition adapter or explicit manual values; no AI-only meal estimate exists in MVP, and drafts never affect totals before confirmation.
5. Changing a portion recalculates nutrients consistently.
6. A meal with unknown fat does not treat fat as zero or claim fat alignment.
7. A partial day is never labeled non-adherent solely for missing records.
8. A complete day uses the exact range/minimum/maximum rules above.
9. Double-tapping Confirm creates one meal.
10. Editing/deleting food updates totals, completeness, and history.
11. Plan updates preserve unaffected historical comparisons.
12. Timezone changes, midnight entries, and DST do not duplicate reflections or redate old meals.
13. Plan-image or meal-photo AI timeout, malformed JSON, rate limits, and vision outage preserve manual plan and meal workflows and deterministic morning templates.
14. A stale plan-image extraction result cannot overwrite a corrected plan draft.
15. Denied camera permission for plan capture and denied push permission have working alternatives.
16. No user can access another user's media, meals, exports, or jobs.
17. Light/dark mode, keyboard flow, screen readers, and reduced motion work across critical screens.
18. Morning copy contains only supported observations and handles no-data days.
19. Export includes plan versions, meals, sources, profile, and reflections; deletion removes their active copies within the stated period.
20. A fresh database can apply migrations and run the app using documented environment configuration.
21. A user can complete manual onboarding, plan entry and review, meal logging, Today, validation recovery, and Settings in either Persian RTL or English LTR.
22. Persian, Arabic-Indic, and Latin digits produce the same canonical numeric values, and Persian UI dates round-trip correctly between Solar Hijri display and Gregorian API storage.
23. Switching languages preserves original Persian, English, and mixed-language plan and meal text.
24. A user without active AI-processing consent receives no AI request and still receives a deterministic localized morning check-in containing only supported server-calculated facts.
25. A first plan defaults to today, a replacement defaults to tomorrow, and any user-selected override cannot activate until the version timeline has no unresolved overlap.
26. Using a saved meal creates an independent editable draft; editing or deleting the saved meal never changes confirmed meal history.
27. Weight entries support create, read, edit, and delete with unit-safe canonical storage and no effect on plan targets. Optional profile weight remains separate and never creates or changes a weight entry without explicit confirmation.
28. A skipped planned slot persists separately from not recorded, clears when a meal is linked, and does not silently return after that meal is removed.
29. Helpful/not-helpful reflection feedback is optional, idempotent, contains no free text, and can be changed or removed.
30. Plan-version history is owner-isolated, and a past-date correction is audited, overlap-safe, immutable, and recomputes only affected summaries.
31. Onboarding offers optional height, profile weight, gender, and birth year. A user can enter all, some, or none; valid values survive Back, refresh, and resume and remain editable in Profile. Invalid entered values receive localized feedback. Persian/Jalali and English/Gregorian birth-year entry persist an integer plus its calendar, survive locale switches without fabricated precision, and do not replace the separate age-eligibility decision. Profile weight does not enable tracking or create a `WeightEntry`; users who omit all four fields can complete every manual MVP journey. Export and deletion include these nullable profile attributes.
32. Meal-photo recognition is available through the configured approved AI provider; all recognized foods, portions, and assumptions are editable, no AI output affects totals or plan comparison before meal confirmation, and nutrients retain database/manual/unknown provenance rather than AI provenance.

#### Optional personal-information acceptance scenarios

These scenarios refine acceptance scenario 31 without changing the numbering above:

1. A user enters valid height, profile weight, gender, and birth year and completes onboarding.
2. A user skips all four and completes onboarding and every manual MVP journey.
3. A user enters any subset and leaves the remaining fields null without errors.
4. A user edits or clears previously entered values in resumed onboarding and Profile settings.
5. Back, refresh, sign-out/return, and onboarding resume preserve partially entered valid values.
6. Invalid entered values receive localized field feedback; clearing or skipping the optional field remains available.
7. Persian/Jalali and English/Gregorian birth-year input validate consistently, store the tagged year/calendar without a full date, and survive locale switching without silent lossy conversion.
8. Saving profile weight does not set `weight_tracking_enabled` or create a `WeightEntry`.
9. Missing optional personal information never blocks plan creation, manual meal logging, Today, history, or Settings.
10. Export contains the nullable profile attributes and birth-year calendar tag separately from tracked weights; account deletion removes both profile attributes and weight history.

Testing: deterministic scoring and date unit tests; database/authorization integration tests; mocked AI contract and failure tests; end-to-end onboarding, plan activation, meal-photo recognition and confirmation, daily reflection, and account lifecycle tests. Use curated Persian, English, and mixed-language evaluation sets for both plan images and representative Iranian meal photos, including multiple foods, household portions, low image quality, and ambiguous preparation; record correction, unresolved-field, and failure rates before public launch.

## 20. Development sequence and launch gates

1. **Foundation:** Repository, README, environment template, schema migrations, auth, tokens, themes, CI.
2. **Manual vertical slice:** Onboarding → structured plan → manual confirmed meal → deterministic Today/history.
3. **AI plan image import:** Image extraction, validation, editable review, versioning, and failed-job recovery. Pasted-text plan extraction is post-MVP.
4. **Nutrition and AI meal-photo integration:** Structured food lookup, portion conversion, required AI food recognition from photos, editable review, user correction, unknown handling, and provenance. Standalone meal-text analysis is post-MVP.
5. **Daily loop:** Completeness, reflection scheduler, fallback copy, optional push.
6. **Hardening:** Accessibility, realistic mobile performance, privacy controls, evaluation, deployment and restore checks.

Development definition of ready:

- This specification is available to the coding agent.
- design-scope.md is available. A design.md or approved Figma file may still be pending; neutral accessible temporary tokens are already approved for technical specification and implementation work.
- Development database, storage, email, worker scheduler, and credentials for the selected DeepSeek, GapGPT, or AvalAI configuration exist.
- Nutrition provider or seed dataset has a documented license and source.
- Environment variables are documented without committed secrets.
- Fixtures include daily/weekly plans, missing targets, manual meals, plan-image drafts, and partial days.

Public release gates:

- Confirm target countries, hosting/data region, and processor/retention terms.
- Confirm nutrition dataset coverage and user-facing estimate wording.
- Validate plan-image extraction on representative Persian, English, and mixed-language plans; document known limitations.
- Validate meal-photo food recognition on representative Iranian foods, mixed dishes, portions, lighting conditions, and Persian/English context; approve the selected provider/model and document known limitations.
- Complete account-isolation, export/deletion, accessibility, scheduling, and failure-path checks.
- Confirm the supported clinical scope and obtain appropriate review of user-facing boundaries.
- Approve final visual design in design.md or Figma and complete Persian and English copy. Temporary tokens do not satisfy this public-release gate.
- Pin current provider/model configuration after live capability tests.

## 21. Product success measures

Proposed measures, evaluated without logging raw health content:

- First-session activation: confirmed plan plus first confirmed meal.
- Median time to confirm a structured manual or saved meal.
- Draft abandonment plus plan-image extraction and meal-photo recognition failure rates.
- Fraction of plan-image extraction drafts corrected and their unresolved-field rate.
- Weekly return to logging and voluntary day completion.
- Reflection helpfulness via optional one-tap feedback.

Measure usefulness and ease, not whether users eat less. No weight-loss outcome promise or target is part of MVP acceptance.

## 22. Instructions for an AI development agent

Implement the manual vertical slice before AI. Use this document as the product and functional source of truth and [design-scope.md](../design/design-scope.md) as the source for information architecture, screens, states, and journeys. Use [visual-design.md](../design/visual-design.md) or the approved Figma file as the visual source when available; otherwise use the approved neutral accessible temporary tokens and record that final visual approval remains a release gate. Keep logic for alignment and nutrient totals deterministic and independently testable. Do not add features outside MVP to fill empty screens. Do not invent medical targets, numeric tolerances, verified nutrition provenance, or deployment credentials. Document unresolved dependencies in README, preserve manual fallbacks, and report which acceptance criteria were actually tested.

## 23. Design scope handoff

The detailed information architecture, page and sheet inventory, screen-level data and actions, shared UI states, required user journeys, bilingual layout requirements, and design coverage checklist are maintained in [design-scope.md](../design/design-scope.md).

This product specification remains the source of truth for product purpose, eligibility, behavior, data rules, safety boundaries, and acceptance criteria. The design scope must remain consistent with those requirements. Manual onboarding, plan entry, meal entry, review, and correction, plan-image extraction, and AI meal-photo food recognition are required. Automatic plan-text extraction and standalone meal-description-text analysis are deferred.
