# Diet Progress Companion Design Scope

Version: 1.3

Date: 2026-11-16

Status: Behavioral design scope complete; visual design pending; aligned with [product-spec.md](../product/product-spec.md)

This document is the design source of truth for user-facing information architecture, pages and sheets, screen-level data and actions, reusable UI states, user journeys, and responsive bilingual coverage. Product policy, eligibility, calculation rules, data contracts, safety boundaries, and acceptance criteria remain owned by [product-spec.md](../product/product-spec.md). Visual tokens, component styling, detailed layout direction, and final brand expression belong in [visual-design.md](./visual-design.md) or an approved Figma file. Until that source exists, neutral accessible temporary tokens are approved but do not constitute final visual design.

## Revision 1.1 resolved decisions

- Age is collected once on O02; O03 does not repeat it. Revision 1.3 adds a separate optional birth-year profile field without changing age-based eligibility.
- Declining AI consent disables AI image processing and selects deterministic localized morning check-ins while preserving all manual plan and meal flows.
- Revision 1.1 named plan-image extraction and AI-written check-ins as the two AI data uses. Revision 1.2 adds user-selected meal photos for food recognition as a third separately disclosed use.
- Meal review uses database/manual nutrient sources and deterministic or user-confirmed plan matching. Model-generated nutrient estimates, confidence scores, and automatic plan mappings remain outside MVP; Revision 1.2 adds only editable meal-photo food recognition.

## Revision 1.2 resolved decision

- Meal-photo food recognition is a required MVP method. It uses one configured approved AI provider—DeepSeek, GapGPT, or AvalAI—and always produces an editable review draft. AI does not supply final nutrient provenance or automatically confirm plan matching; database/manual values and explicit user confirmation remain authoritative.

## Revision 1.3 resolved decision

- O03 offers optional height, profile weight, gender, and birth year. Each field and the entire group may be skipped; values persist across Back, refresh, and resumed onboarding and remain editable in S02.
- O02 age remains the adult-eligibility input. O03 birth year is optional profile information and never silently replaces or recalculates eligibility.
- O03 profile weight is not weight tracking. It does not enable tracking or create a history entry; H03 remains the explicit first-entry flow after the user opts in.

## 1. Information architecture and design scope

This section defines the MVP design surface. Each numbered item is a distinct responsive page unless explicitly identified as a modal, sheet, or reusable state. Persian and English use the same information architecture. Persian mirrors directional layout where appropriate but does not change content priority.

### 1.1 Global navigation and page rules

- Signed-out users can access only Authentication, Legal documents, and account-recovery states.
- Signed-in users who have not completed the required onboarding steps resume at the first incomplete step. They may sign out but cannot enter the main application until required consent, age eligibility, locale, timezone, and basic profile fields are complete.
- Main mobile navigation contains Today, History, Plan, and Settings. A persistent Log meal action is available from Today, History day detail, and other main pages where it does not obscure a destructive or confirmation action.
- Desktop uses the same destinations in a persistent side navigation. Do not create desktop-only product destinations.
- Page titles, Back behavior, unsaved-change protection, loading, empty, offline, permission-denied, and recoverable-error states are required design variants.
- Today and a historical Day detail share the same meal-list and nutrition components, but Today additionally supports morning reflection, contextual next action, active drafts, and day completion.
- Modal and sheet behavior must preserve keyboard focus, announce its title, close with Escape where safe, and warn before discarding edits.
- Dates are shown in Solar Hijri with Persian numerals in Persian UI and localized Gregorian form in English UI. Internal route and API dates remain `YYYY-MM-DD` Gregorian values.

### 1.2 Page inventory

#### A01 Sign in

**Purpose:** Start or resume an account using email one-time-code authentication.

**Shows:** Product name and concise purpose; language switch; email field; privacy and terms links; explanation that a code will be sent; service/error status.

**Actions:** Change language; enter email; request code; open Privacy or Terms.

**States:** Initial; invalid email; submitting; rate limited; email unavailable; generic service failure. Do not reveal whether an email already has an account.

#### A02 Verify email code

**Purpose:** Complete authentication.

**Shows:** Masked destination email; segmented or single accessible code input; resend countdown; expiry guidance.

**Actions:** Submit code; paste full code; resend after countdown; change email; change language.

**States:** Waiting; verifying; invalid; expired; too many attempts; resent; service failure. Successful existing users go to Today; incomplete users resume onboarding.

#### O01 Welcome and language

**Purpose:** Set expectations and establish interface language.

**Shows:** Product purpose; three-step explanation of add plan, log meals, and review progress; estimate-review warning; Persian and English choices.

**Actions:** Select language; continue; sign out.

**Required output:** Persisted locale.

#### O02 Eligibility and consent

**Purpose:** Confirm adult eligibility, non-clinical scope, and required legal consent.

**Shows:** Age input; plain-language product boundary; Privacy and Terms links; required acceptance; one optional/withdrawable AI-processing consent with three separately described purposes: (1) sending a user-selected plan image for extraction, (2) sending a user-selected meal photo for food recognition, and (3) sending an allowlisted structured daily summary for AI-written morning check-ins.

**Actions:** Enter age; accept required terms; grant or decline AI processing consent; continue; back.

**States:** Under 18 blocked; missing required legal acceptance; unavailable policy; AI consent granted or declined. Declining AI consent disables plan-image extraction and meal-photo food recognition, preserves manual plan and meal entry, and uses deterministic localized templates for future morning check-ins.

#### O03 Profile basics

**Purpose:** Collect basic personalization after eligibility is already established.

**Shows:** Preferred name optional; metric/imperial unit preference; explanation of unit behavior; Back/Edit eligibility link; and a clearly optional personal-information group containing height, profile weight, gender, and birth year. Persian presents a Jalali-friendly birth-year control and Persian numerals; English presents a Gregorian year control. The group explains that these values are private, editable later, and not needed for plans, meal logging, Today, or progress calculations. Age is not repeated.

**Actions:** Enter/edit preferred name; select unit preference; enter any subset of optional personal information; choose an inclusive gender option or bounded self-description; Skip; Continue; back or open Edit eligibility.

**States:** All optional attributes empty; all entered; partial entry; field-level invalid value; unusual measurement clarification; birth-year/eligibility inconsistency requiring correction or Skip; saved/failed. Back, refresh, and resume restore entered values. No calorie target is generated. Empty optional fields never show validation errors.

#### O04 Goal and plan context

**Purpose:** Establish eligible product use before plan entry.

**Shows:** Goal choices—lose, maintain, or gain weight; plan source choices—dietitian, fitness coach, self, or not specified; question asking whether the plan manages a medical condition; optional dietary preferences and allergy notes with a warning that the product does not detect allergens.

**Actions:** Select goal and source; answer clinical-use question; enter optional context; continue; back.

**States:** Medical-condition use blocks that plan's activation and explains the boundary. The user may continue onboarding without an active plan and use manual meal logging.

#### O05 Time and appearance

**Purpose:** Set localization and daily-message preferences.

**Shows:** Detected timezone with Asia/Tehran default; morning-message time defaulting to 08:00; theme choice—system, light, dark; language choice repeated for correction; push introduction without browser permission prompt.

**Actions:** Confirm/change timezone; set time; select theme/language; choose whether to configure push after onboarding; continue; back.

#### O06 Add a plan

**Purpose:** Choose how to create the first plan draft.

**Shows:** Manual entry and plan image upload options; supported image types and size; supported plan formats; privacy/AI explanation tied to consent; Continue without a plan. Pasted-text plan extraction is not shown in MVP.

**Actions:** Start manual entry; choose or take a plan image; review or grant AI consent; continue without a plan; back.

**States:** AI consent absent—with explicit copy that plan-image extraction is disabled, manual plan entry remains available, and morning check-ins use deterministic templates; camera unsupported/denied; extraction unavailable; unsupported image; upload or extraction failure; quota reached. Manual entry always remains enabled.

#### O07 Plan editor and review

**Purpose:** Build or correct a complete structured plan draft before activation.

**Shows:** Plan title; optional author type and note; goal; schedule type; day tabs; meal slots; preferred times; food options; portions; alternative groups; explicit substitutions; numeric meal/daily targets; minimum/maximum/range/exact rule types; unresolved questions; original source text or image when present; effective date. A first plan defaults to today in the user's timezone; a replacement or new version defaults to tomorrow.

**Actions:** Add, edit, reorder, duplicate, or delete days, slots, foods, alternatives, portions, and targets; apply one day to others; answer ambiguity questions; accept or change the effective date; save draft; preview; continue; back.

**States:** Empty manual draft; image extraction processing; extraction failed; extracted draft; unresolved required ambiguity; unsaved edits; validation errors. Extracted values are visually distinguishable until reviewed, but visual treatment must not imply clinical risk.

#### O08 Plan activation confirmation

**Purpose:** Ensure users understand exactly what comparisons will use.

**Shows:** Compact plan summary; effective date and whether it uses the first-plan or replacement default; included days and slots; available numeric targets; unavailable comparisons; unresolved non-blocking fields; non-clinical declaration; replacement and historical impact if another plan exists.

**Actions:** Activate plan; return to editor; save without activating; cancel replacement.

**States:** Blocking ambiguity; overlapping effective date; past-date correction requiring explicit confirmation; medical-purpose declaration; stale draft revision; activation failure. Activation success enters First action.

#### O09 First action

**Purpose:** Complete onboarding and orient the user.

**Shows:** Activation success or the no-plan state; Today preview; primary Log first meal action; Add a plan when no plan is active; optional Configure push action if previously selected.

**Actions:** Go to Log meal; open Today; add a plan; configure push.

#### T01 Today

**Purpose:** Provide the daily overview and the next useful action.

**Shows, in this order:** Selected date with previous/next controls; morning check-in card when available; data-revision notice when the check-in is stale; completeness state; energy versus target when evaluable; compact protein, carbohydrate, fat, and optional fiber values; one contextual next action; active meal draft if present; chronological confirmed meals; planned slots and their states; unknown-nutrient explanation where relevant; weight is not shown by default on Today. The card does not visually expose whether its copy was AI-written or deterministically templated unless required by privacy policy.

**Actions:** Change date; expand/collapse reflection and nutrients; give optional helpful/not helpful reflection feedback; resume draft; log meal; add a plan when none is active; open a meal; open a planned slot to log against it or mark it skipped; undo a recent deletion; mark day complete; reopen day; open applicable plan.

**States:** No active plan with logged meals plus Add a plan; no active plan with no meals plus Log meal as primary and Add a plan as secondary; no applicable plan for date; plan but no meals; partial day; complete day; failed meal draft; unavailable nutrition lookup; unavailable summary; offline; check-in pending/AI-written/deterministic-no-consent/deterministic-fallback/stale; future date read-only for intake. Plan matching and numeric plan comparisons are hidden whenever no eligible plan applies. Only one primary next action is emphasized.

#### M01 Log meal method sheet

**Type:** Modal or bottom sheet, not a navigation destination.

**Shows:** Take/upload meal photo for AI food recognition, Structured Manual entry, Saved meals, and Recent meals; the preselected planned slot when launched from one. Standalone meal-text analysis is not shown in MVP.

**Actions:** Select a method; close.

**States:** Default; saved meals empty; recent meals empty; AI consent absent; camera denied; unsupported image; upload failure; recognition queued/processing/failed/quota reached. Every unavailable photo state offers Structured Manual entry without losing the draft.

#### M02 Meal details and input

**Purpose:** Capture source information, timing, and intended plan relationship.

**Shows:** Date; time; meal type; optional planned-slot selector; meal-photo preview and recognition progress when used; structured manual items; optional preparation/context note; saved/recent meal summary when reused.

**Actions:** Change date/time/type/slot; take, upload, replace, or remove a meal photo; start/retry recognition; add manual food items and quantities; add an optional preparation/context note; choose recent/saved meal; continue to review; save draft; cancel.

**States:** Future time rejected; invalid or incomplete structured item; draft restored; save-draft failure; upload/recognition queued, processing, failed, canceled, or superseded. Reused and recognized meals remain editable before confirmation.

#### M03 Meal review

**Purpose:** Review all food items and nutrition before confirmation.

**Shows:** Editable item list; AI-recognized food candidates and clearly labeled assumptions/uncertainties when a photo was used; each item's name, amount, unit, optional grams, energy and nutrients; database, food-label, manual, or unknown nutrient source label (never AI as final nutrient provenance); source version when useful; preparation notes; unknown values; portion-conversion explanation; meal totals; linked slot; deterministic exact match when one exists or Needs review for ambiguous mapping; questions about oil, sauce, preparation, and portion entered as ordinary form fields; effect on daily totals presented as information, not a verdict.

**Actions:** Add/edit/delete/reorder items; change quantity/unit; enter or override nutrients; edit preparation details; accept a labeled database/portion-conversion estimate; mark values unknown; change slot; confirm an ambiguous alternative/substitution or leave it Needs review; save as reusable meal; confirm meal; save draft; cancel.

**States:** Recognition ready for review; uncertain or unrecognized item; complete manual/database data; incomplete nutrition; unresolved required portion; nutrition lookup unavailable; recalculating after a quantity or source change; saving; save failure; duplicate warning; revision conflict. No recognized result affects totals or comparisons until the meal is confirmed. Confirm is available with incomplete nutrition only after the user acknowledges resulting comparison limitations.

#### M04 Meal detail and edit

**Purpose:** Inspect or revise a confirmed meal.

**Shows:** Consumed date/time; meal type; item list and totals; source/provenance labels; plan slot and match explanation; created/last-edited metadata where useful.

**Actions:** Edit; duplicate as new meal; save as reusable meal; delete; return to day.

**States:** Read-only; editing using the M03 component; stale revision conflict; delete confirmation; 10-second deletion Undo shown on return.

#### M05 Saved meals

**Purpose:** Manage reusable meal templates.

**Shows:** Searchable saved meal list with name, short contents, nutrients when known, and last used date.

**Actions:** Search; select to create an editable meal draft; rename; edit template; delete template.

**States:** Empty; results; no search match; deletion confirmation. Editing a template never changes historic meals.

#### H01 History

**Purpose:** Review recent logging, plan comparison, and weight trends without producing a single adherence score.

**Shows:** Seven-day rows with localized date, completeness, known energy, evaluable range status, meals logged, unknown-data marker, and applicable-plan marker; date picker; optional compact weight trend after at least two entries; latest weight and change over the selected period without causal claims.

**Actions:** Move by week; choose date; open Day detail; enable weight tracking when disabled; add weight or open Weight history when enabled.

**States:** No history; partial history; days without plans; days with unknown totals; weight tracking disabled; tracking enabled with no entry; one entry with no trend; trend available.

#### H02 Day detail

**Purpose:** Review or correct a saved date.

**Shows:** The T01 daily summary components for the selected historical date; confirmed meals; planned-slot states; completeness; comparisons; applicable plan version. Morning reflection may be shown as historical content but is not regenerated by default.

**Actions:** Open/edit/delete meal; log a meal for this date; mark slot skipped; mark complete/reopen; open plan version; move to adjacent date.

**States:** Same relevant states as T01, excluding today's contextual morning-generation state. Future dates do not permit consumed meals.

#### H03 Add weight sheet

**Type:** Modal or bottom sheet.

**Shows:** Weight value; unit; measurement date and optional time; previous entry for context.

**Actions:** Save; cancel; switch unit with conversion preview.

**States:** Invalid/unusual value; duplicate-time warning; save failure.

#### H04 Weight history

**Purpose:** Review weight as a separate progress signal.

**Shows:** Current and starting values for the selected period; compact trend after at least two entries; chronological entries; units; neutral explanation that changes are not attributed to individual meals.

**Actions:** Change period; add; edit; delete an entry.

**States:** Empty; one entry; multiple entries; delete confirmation. Do not show BMI, ideal weight, forecast, achievement judgment, or automatic target line in MVP.

#### P01 Plan overview

**Purpose:** Show the active plan and entry points for plan management.

**Shows:** Active plan title; optional author metadata; goal; effective dates; schedule summary; today's slots; numeric targets when present; qualitative-plan explanation when absent; source type; last updated; pending draft; previous versions.

**Actions:** Add a plan when none is active; view full plan; resume draft; create replacement; correct a past date; open version history; deactivate only if a later product decision explicitly permits deactivation.

**States:** No plan; active plan; scheduled future plan; pending draft; plan gap; inactive historical versions.

#### P02 Plan detail

**Purpose:** Read the applicable immutable plan version.

**Shows:** Metadata; effective period; daily/weekly schedule; slots; food options; portions; alternatives; substitutions; targets and rule types; unavailable fields; retained source note or sanitized source image if permitted.

**Actions:** Choose day; expand details; start replacement from this version; correct application for a past date; delete retained source image without deleting structured plan.

**States:** Active; scheduled; expired; corrected historical version. Immutable versions are never edited in place.

#### P03 Create or replace plan

**Purpose:** Start plan creation outside onboarding.

**Shows and actions:** Reuses O06, O07, and O08. When replacing a plan, tomorrow is the proposed default effective date; also show the resulting current-plan end date and historical-preservation explanation. The user may override the date subject to overlap validation and explicit historical-correction confirmation when applicable.

#### P04 Plan version history

**Purpose:** Make plan changes understandable and auditable.

**Shows:** Chronological versions with title, status, effective range, created date, source type, and reason/note when provided.

**Actions:** Open version; compare summary with adjacent version; start replacement from a version.

**States:** One version; multiple versions; scheduled future replacement. Detailed field-by-field visual diff is not required in MVP.

#### S01 Settings

**Purpose:** Provide grouped access to account and application controls.

**Shows:** Profile summary; language; appearance; timezone and morning time; notification state; AI-processing consent state; data and privacy links; Help/About; sign out.

**Actions:** Open each settings page; sign out.

#### S02 Profile and goals

**Shows:** Preferred name; age; goal; unit preference; optional height, profile weight, gender, and birth year; weight-tracking on/off state; optional dietary preferences/allergy notes; plan authorship is managed on the plan, not profile. Profile weight and tracked weight history are labeled as separate concepts.

**Actions:** Edit, clear, and save optional personal attributes; switch units; enable weight tracking and continue to H03 for the first entry; disable weight tracking with a clear retention explanation; cancel. If a profile weight exists after tracking is enabled, H03 may offer it as a prefill but requires explicit confirmation before creating the first entry.

**Rules:** Editing profile weight never edits weight history. Enabling tracking requests the first tracked weight only after explicit confirmation and never converts profile weight into history automatically. Disabling tracking hides weight prompts and trends but does not delete existing entries; deletion remains available in H04. Changing goal, unit preference, or optional personal information does not alter plan targets or canonical stored weights.

#### S03 Language and appearance

**Shows:** Persian/English selection; live direction preview; system/light/dark choice; date and numeral examples.

**Actions:** Change language; change theme; save or apply immediately with reversible confirmation.

#### S04 Time and notifications

**Shows:** Timezone; morning-message time; in-app reflection status; push support, permission, subscription, and enabled state; generic lock-screen copy example.

**Actions:** Change timezone/time; enable/disable push; trigger browser permission only after explicit enable action; repair expired subscription; send a test notification if technically supported.

**States:** Unsupported; permission not asked; allowed; denied; blocked in browser settings; subscribed; delivery error. The in-app morning check-in cannot be disabled unless a later product decision adds that preference. AI consent changes its generation method, not its availability.

#### S05 Privacy and AI consent

**Shows:** Current AI-processing consent and its three separately named purposes: plan-image extraction using a user-selected image, meal-photo food recognition using a user-selected meal image, and AI-written morning check-ins using only an allowlisted structured daily summary. Also show the configured provider, provider-retention notice, manual plan and meal alternatives, deterministic check-in alternative, image-retention controls, and Privacy and Terms links.

**Actions:** Grant or withdraw AI consent; open policy; manage retained images.

**Rules:** Withdrawal immediately prevents new plan-image extraction, meal-photo recognition, and AI-writing jobs, cancels queued jobs where possible, preserves manual plan and meal entry, and switches future morning check-ins to deterministic localized templates. It does not silently delete confirmed user records or rewrite previously generated text; deletion is handled through Data controls.

#### S06 Data controls

**Shows:** Export explanation and status; account-deletion explanation and timelines; active export job; link to retained media management if separate.

**Actions:** Request export; download completed export using a short-lived link; retry failed export; begin account deletion.

**States:** No job; queued; processing; ready; expired; failed.

#### S07 Delete account confirmation

**Purpose:** Prevent accidental deletion and disclose timing.

**Shows:** Active-data deletion target; backup-expiry target; AI-provider limitation; consequences; reauthentication input; explicit confirmation phrase or checkbox.

**Actions:** Reauthenticate; confirm deletion; cancel.

**States:** Invalid authentication; deletion queued; failure with support/retry path. After successful initiation, sign out and show a status confirmation page without exposing health data.

#### L01 Legal document

**Purpose:** Display Privacy Policy or Terms in the selected language.

**Shows:** Document title, version/effective date, localized content, language switch, Back.

**Actions:** Change language; return. Acceptance occurs only in the relevant consent flow, not merely by viewing.

### 1.3 Shared overlays and reusable states

- **Date picker:** Localized calendar; Solar Hijri presentation in Persian, Gregorian presentation in English; clear selected date and Today shortcut.
- **Planned-slot selector:** Applicable slots for the meal's local date plus Unplanned; shows recorded/skipped state without blocking selection.
- **Delete confirmation:** Names the entity and consequence. Meals use delayed commit with a 10-second Undo; account deletion does not.
- **Unsaved changes:** Stay, discard, or save draft where supported.
- **Connection state:** Persistent unobtrusive offline notice. Draft edits remain in the active session, but confirmation requiring the server is disabled with explanation.
- **AI image job status:** Plan images use queued, extracting, ready for review, failed, canceled, or superseded. Meal photos use queued, recognizing, ready for review, failed, canceled, or superseded. Both include Retry and the appropriate Manual entry fallback.
- **Unknown data:** Explains which totals or comparisons are unavailable and identifies the item requiring review.
- **Permission education:** Explains benefit and fallback before invoking camera or push permission.
- **Toast/banner policy:** Toasts confirm low-risk durable actions. Blocking errors and data-loss risks appear inline or as banners and cannot rely on a disappearing toast.

### 1.4 Explicitly excluded design surfaces

Do not design chat, social/community, clinician or coach portal, plan-author invitations, payment/subscription, diet generation, automatic targets, exercise logging, water tracking, barcode scanning, voice logging, wearables, meal delivery, detailed micronutrients, competitive streaks, leaderboards, BMI dashboards, or administrative back-office tools as part of the user-facing MVP.

Automatic plan-text extraction and standalone meal-description-text analysis are deferred beyond MVP and must not appear in launch designs. Plan-image extraction and meal-photo food recognition are required for launch. Manual onboarding, plan entry, meal entry, review, and correction remain required regardless of AI availability.

## 2. Required user journeys

Each journey must be designed and tested in Persian RTL and English LTR. A journey includes success, recoverable failure, Back, refresh/resume, and cancellation behavior where applicable.

### J01 New user to first confirmed meal

1. User opens A01, chooses language, enters email, and completes A02.
2. User completes O01–O05, including eligibility, consent, profile, goal, non-clinical declaration, timezone, and appearance. In O03 the user may enter all, some, or none of height, profile weight, gender, and birth year without affecting progress.
3. User either selects Manual entry in O06, structures and activates a plan through O07–O08, or selects Continue without a plan.
4. O09 sends the user to M01 with Log first meal emphasized. Without a plan, Add a plan remains available as a secondary action.
5. User enters meal metadata in M02, reviews items and nutrients in M03, and confirms.
6. User lands on T01 with the meal and updated known totals. Slot state and plan comparisons appear only when an eligible plan applies.

**Success condition:** A confirmed meal exists with or without a plan; no AI feature is required. A first plan defaults to today, so an immediately logged meal can use today's plan. Without a plan, the user can maintain a manual food log and later activate a plan, which enables only comparisons applicable from that plan's effective date.

### J02 Resume interrupted onboarding

1. User leaves after any completed onboarding step.
2. Returning authentication restores persisted answers and opens the first incomplete page.
3. Back reveals previously confirmed values, including any partially entered optional personal information; editing or clearing them updates dependent validation without erasing the plan draft.

**Success condition:** No confirmed step, optional profile value, or draft is lost, and the user cannot accidentally bypass required eligibility or consent. Skipping all optional personal attributes is valid.

### J03 Activate a plan without numeric targets

1. User enters meal slots, foods, portions, and alternatives in O07 but no calorie or macro targets.
2. O08 states that numeric target comparisons will be unavailable while meal-plan matching remains available.
3. User activates and reaches T01.

**Success condition:** Today shows plan slots and meal matching without empty charts, fabricated targets, or prompts to generate targets.

### J04 Medical-plan boundary

1. In O04 or O08, user states the plan is prescribed to manage a medical condition.
2. Product explains that condition-specific plan tracking is outside MVP and blocks activation.
3. User can correct an accidental answer, save non-sensitive onboarding progress, view policies, or sign out.

**Success condition:** No medical plan is activated and no condition-specific coaching is produced.

### J05 Log a manual meal against a planned slot

1. From T01, user selects a planned slot and opens M01 with that slot preselected.
2. User chooses Manual entry, adds items and portions in M02/M03, and supplies known nutrients or leaves explicit unknowns.
3. User confirms the slot mapping and meal.
4. T01 updates the slot, meal list, totals, and comparison explanation.

**Success condition:** Meal is saved once, linked to one slot, and unknowns do not become zero.

### J06 Log an unplanned snack

1. User opens M01 from the persistent action and selects Manual entry.
2. User selects Unplanned and confirms the snack through M02/M03.
3. T01 includes it in intake totals without marking a planned slot as completed or morally labeling the snack.

### J07 Log incomplete nutrition

1. User creates a meal with one or more unknown nutrients.
2. M03 explains which daily comparisons will be unavailable and requests acknowledgement.
3. User confirms.
4. T01 shows known totals as at least-values where appropriate and no within/below claim for affected nutrients.

### J08 Reuse a recent or saved meal

1. User opens M01 and chooses Recent or Saved.
2. M05 or the recent list supplies a snapshot to M02/M03.
3. User changes date, portion, or items and confirms.

**Success condition:** A new meal is created; the template and original historic meal are unchanged.

### J09 Edit or delete a confirmed meal

1. User opens M04 from Today or Day detail.
2. Edit reuses M03; save recalculates summaries and reopens a previously complete day.
3. Delete requires confirmation, returns to the day, and offers Undo for 10 seconds.

**Success condition:** Totals, slot state, completeness, and History use the committed revision; stale concurrent edits cannot overwrite it.

### J10 Complete and reopen a day

1. User selects I've logged everything for today on T01.
2. Product summarizes unresolved unknowns without preventing completion and asks for explicit confirmation.
3. Complete-day rules evaluate available numeric targets.
4. Adding, editing, or deleting a meal automatically reopens the day and explains why.

### J11 Review history and correct a past day

1. User opens H01, selects a date, and enters H02.
2. User reviews the applicable historical plan version and comparisons.
3. User adds or edits a meal or completeness state.
4. The selected day and seven-day list recompute; other dates remain unchanged unless a plan correction explicitly affects them.

### J12 Track weight separately

1. With tracking disabled, History and S02 offer Enable weight tracking without requesting a value in advance.
2. User explicitly enables it and then opens H03 to enter the first weight and measurement date.
3. With one entry, History shows the value without a trend.
4. With at least two entries, H01/H04 show a neutral compact trend.
5. User can edit/delete entries in H04 or disable tracking in S02. Disabling hides weight UI but preserves entries until the user deletes them.

An optional O03/S02 profile weight may prefill H03 only after tracking is explicitly enabled. The user must still confirm the measurement date/value to create a `WeightEntry`; skipping or editing profile weight never changes tracking state or history.

**Success condition:** No meal-level attribution, BMI judgment, automatic goal, or plan-target change occurs.

### J13 Replace an active plan

1. User starts replacement from P01 or P02.
2. P03 reuses plan creation with the current plan as an optional starting point.
3. Tomorrow is preselected as the effective date. The user accepts it or chooses another date, resolves any overlap, reviews historical impact, and activates.
4. P01 shows the scheduled/current version; P04 retains history.

**Success condition:** Only one version applies per date and historic meals retain their applicable version.

### J14 Switch language

1. User changes language in O01/O05 or S03.
2. Navigation direction, system copy, validation, dates, and displayed numerals update.
3. Persian, English, and mixed-language user-entered content remains byte-for-byte unchanged except for separately stored structured numeric normalization.

**Success condition:** The user remains on the equivalent page with no lost draft or changed content.

### J15 Morning reflection

1. Scheduler reads the approved daily summary and the current AI-consent state.
2. With active consent, it creates an AI-written reflection in the selected language. Without consent, it selects and fills an approved deterministic localized template in application code without making an AI request.
3. T01 shows the card and optional push uses generic copy.
4. User expands/collapses it and may mark it helpful or not helpful.
5. If late edits change the source revision, the card states it reflects an earlier snapshot; deterministic dashboard data updates immediately.
6. AI generation failure produces localized deterministic fallback copy. If no supported observation exists, both methods use an approved no-data template.

### J16 Withdraw AI consent

1. User opens S05 and reviews consequences.
2. User withdraws consent.
3. New AI entry points become unavailable with a Manual entry alternative; queued work is canceled where possible.
4. Future morning check-ins use deterministic localized templates without AI requests.
5. Confirmed meals, structured plans, and existing reflections remain unless the user separately deletes them.

### J17 Export data

1. User requests export in S06.
2. Page shows queued/processing status across refreshes.
3. When ready, user downloads through a private expiring link.
4. Expired or failed exports can be requested again without duplicate active jobs.

### J18 Delete account

1. User starts in S06 and reviews S07.
2. User reauthenticates and explicitly confirms.
3. Product queues deletion, signs the user out, and shows the disclosed active-data and backup timelines.

### J19 Conditional automatic extraction

This journey is required for plan-image extraction and meal-photo food recognition. Pasted-text plan extraction and standalone meal-description-text analysis are explicitly excluded.

1. User selects a plan image in O06, supplies input, and sees upload/job progress.
2. Refresh reconnects to the same job; timeout or failure offers Retry and Manual entry.
3. Successful analysis opens O07 with proposed plan values, assumptions, unknowns, and source labels.
4. No extracted value affects plan comparison until the user reviews and activates the plan.
5. For a meal photo, user selects Take/upload photo in M01/M02, sees upload and recognition progress, and then reviews proposed foods, portions, preparation assumptions, unknowns, and database/manual nutrient sources in M03.
6. No recognized meal result affects totals or plan comparison until the user edits as needed and confirms the meal.

### J20 Permission denial and service outage

1. Camera denial during plan or meal capture returns to the originating screen with Upload image and the appropriate Manual entry option.
2. Push denial leaves in-app reflections working and explains how to change browser settings.
3. AI or nutrition-provider outage retains the draft and enables manual values.
4. Network save failure keeps the session draft, does not show success, and offers Retry.

## 3. Design deliverables and coverage checklist

The design is complete only when it includes:

- Mobile frames at 320 px and a representative modern mobile width for every required page.
- One representative desktop layout for every main navigation destination and every form pattern; modal behavior may be documented as a component rather than repeated on every page.
- Persian RTL and English LTR versions of all critical-path pages: A01–A02, O01–O09, T01, M01–M04, H01–H03, P01–P03, and S01–S07.
- Component variants for default, focus, hover where applicable, disabled, loading, error, success, unknown, selected, and destructive states.
- All page-specific empty, loading, processing, partial-data, service-failure, permission-denied, and offline states listed above.
- Keyboard order, focus return, screen-reader labels/status announcements, touch targets, text expansion, reduced motion, and contrast annotations for critical components.
- Content specifications for Persian and English system copy, including validation and fallback text; user-entered content may remain fixture data.
- O03/S02 variants for all four optional personal attributes: all entered, all skipped, partial entry, edit/clear, resume, invalid input, Jalali/Gregorian birth-year presentation, and profile-weight-with-tracking-disabled. Copy must not pressure disclosure.
- Prototype coverage for J01, J05, J09, J10, J13, J14, J16, both J19 image flows, and J20.
- A traceability note from each frame or component to its page ID and relevant journey ID. Designs without these identifiers are not considered implementation-ready.
