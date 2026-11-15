# Dietyaar engineering contract

Read `docs/README.md` and the linked product, design, and technical specifications before making product decisions. The precedence rules in `docs/engineering/technical-spec.md` govern conflicts.

## Architecture

- Next.js App Router, strict TypeScript, Prisma/PostgreSQL, locally owned UI primitives, and framework-independent services.
- Persian and English are runtime locales through `next-intl`; preserve RTL/LTR parity and logical CSS utilities.
- Better Auth sits behind the identity boundary. Do not revive the boilerplate's custom cookie auth or admin-created-user model.
- Pages and route handlers read through services, never Prisma directly. Actions authenticate/authorize, validate with Zod, call one service operation, and revalidate.
- Services own writes to their domain tables. Pure domain code has no framework, I/O, locale, clock, or database dependency.
- The core manual experience must work without AI, storage uploads, or provider credentials.

## Security and data

- Every owned lookup includes the authenticated user ID; add adversarial cross-account tests.
- Use `src/lib/env.ts` for server environment values and keep secrets out of browser bundles and Git.
- Do not run destructive Prisma reset/push commands. Every schema change has a committed migration.
- AI output is untrusted and optional. Never let it directly confirm or overwrite a user record.
- Media is private and temporary; signed URLs are secrets.

## UI and localization

- User-facing text belongs in both locale dictionaries and key parity is required.
- Use logical Tailwind utilities (`ms`, `me`, `ps`, `pe`, `start`, `end`) and directional icon transforms.
- Import UI primitives from the local component surface. Icon-only controls need accessible names.
- Persian free text is normalized and uses `dir="auto"`; inline codes/usernames use an LTR wrapper.

## Delivery

- Implement the manual vertical slice before optional AI features.
- Run `npm run lint:all`, `npm test`, and `npm run build` before reporting completion.
- Update the source-of-truth document and add an ADR when a product or architecture decision changes.
- Consult the installed Next.js documentation under `node_modules/next/dist/docs/` for version-specific behavior.
