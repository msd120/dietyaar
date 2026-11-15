# 008 — Controlled adoption of the Next.js boilerplate

**Status:** Accepted — 2026-11-15

## Decision

Dietyaar adopts `amirmhp98/mhp-nextjs-boilerplate` at commit `a6228062889af58805fba519cd2c00331808893d` by controlled file import. The upstream `setup.sh` was not run because it deletes Git history, removes one locale, and rewrites project documentation and CI.

We retain the App Router foundation, strict TypeScript, service boundaries, local UI primitives, RTL safeguards, Prisma/PostgreSQL tooling, tests, Docker, CI, environment validation, logging, and Renovate configuration.

We supersede upstream ADR-002 (custom cookie sessions), ADR-003 (single build-time locale), and ADR-007 (placeholder-first product definition). Dietyaar uses Better Auth behind an identity boundary, request-scoped `next-intl` with Persian and English, and the approved product/design/technical specifications. The upstream admin module, seed credentials, placeholder dashboard, template setup automation, and tool-specific metadata are not Dietyaar product features.

## Consequences

- Upstream changes are reviewed and cherry-picked; this is not an unmodified template clone.
- The dependency lockfile is regenerated and audited rather than accepted blindly.
- Better Auth/Prisma/Next.js compatibility is a required spike before identity implementation.
- The manual bilingual product flow is implemented before optional AI features.
