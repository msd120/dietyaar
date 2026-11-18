# 016 — Optional onboarding profile attributes

**Status:** Accepted — 2026-11-16

## Decision

Dietyaar offers height, profile weight, gender, and birth year during onboarding as four independent, nullable profile attributes. Users may enter all, some, or none and can edit or clear them later. Missing values never block onboarding, plan creation, manual meal logging, Today, or another core MVP journey.

Age remains the separate authoritative adult-eligibility input. Birth year is collected without month or day and stored as an integer paired with its `jalali` or `gregorian` calendar. Persian defaults to a Jalali-friendly presentation and English to Gregorian. Because a year alone cannot be losslessly converted between those calendars, locale changes preserve and label the original pair instead of fabricating precision. Birth year does not silently derive or overwrite eligibility.

Height and profile weight are stored in canonical centimeters and kilograms after locale-aware unit and digit normalization. Gender uses inclusive canonical choices with an optional bounded self-description; Dietyaar does not infer sex or calculate targets from gender.

Profile weight is not ongoing weight tracking. Saving or editing it does not enable tracking and does not create or mutate a `WeightEntry`. After a user separately opts into tracking, it may be offered as a prefill for the first entry, which still requires explicit confirmation.

## Consequences

- Product, design, technical, export, deletion, localization, validation, privacy, and test documentation must cover all/some/none, edit/clear, resume, invalid values, and both calendar presentations.
- The four fields are private owner-scoped profile data and are included in export and account deletion.
- No BMR/TDEE, nutrition target, plan behavior, or health judgment is derived from these fields.
- This decision supersedes earlier statements that height, weight, and gender are not collected in MVP, but it does not change the opt-in weight-history model or any unrelated product decision.
