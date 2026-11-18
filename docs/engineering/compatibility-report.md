# FND-01 compatibility report

Date: 2026-11-17  
Status: **Pass for the FND-01 baseline; identity implementation remains IDN-01 scope**

## Adopted reproducible baseline

| Component           | Declared/adopted version | Evidence and rationale                                                                                               |
| ------------------- | -----------------------: | -------------------------------------------------------------------------------------------------------------------- |
| Node.js             |                  24.22.1 | Exact `.nvmrc` and Docker tag. Node 24 is an LTS line; the local verification runtime is 24.22.1.                    |
| npm                 |                  11.19.1 | Exact `packageManager` and engine value; matches the local verification client.                                      |
| Next.js             |                   16.4.6 | Exact application and lockfile version. Next 16 is Active LTS and this release's installed docs require Node >=20.9. |
| React / React DOM   |                   19.3.0 | Exact matching pair accepted by Next 16.4.6 and Better Auth 1.7.25 peer ranges.                                      |
| TypeScript          |                    6.0.3 | Exact version accepted by Prisma 6.19.3 (`>=5.1`) and the current build/typecheck.                                   |
| Prisma CLI / client |          6.19.3 / 6.19.3 | Exact matching pair; generation and PostgreSQL adapter spike pass. No major upgrade was attempted.                   |
| Better Auth         |                   1.7.25 | Exact version; current peer metadata includes Next 16, React 19, Prisma 6, and Vitest 5.                             |
| next-intl           |                   4.15.1 | Exact version retained for the governing locale architecture.                                                        |
| PostgreSQL          |                16-alpine | Existing Compose/CI baseline retained; the compatibility test ran against it.                                        |

`package-lock.json` remains the complete transitive dependency authority. Critical framework/runtime/auth/database packages are also exact in `package.json` so ordinary installs cannot silently move those boundaries.

## Alignment findings

- Before FND-01, `.nvmrc` and Docker used floating LTS selectors while `package.json` only required Node >=22. CI consumed the floating `.nvmrc`.
- `.nvmrc`, the Node engine range, Docker, and CI are now aligned on the Node 24.22.1 line. CI already reads `.nvmrc`, so no workflow edit was required.
- Next was declared as `^16.3.5` but locked/installed as 16.4.6. `eslint-config-next` was 16.3.5 while Next was 16.4.6. Both are now exactly 16.4.6.
- Prisma CLI and client remain exactly matched at 6.19.3.

## Dependency and security assessment

- `npm audit --json` after lockfile synchronization: 0 critical, 0 high, 0 moderate, 0 low vulnerabilities across 760 dependencies.
- Better Auth 1.7.25 is newer than the patched boundary for the reviewed critical Magic Link/OAuth advisory. Dietyaar does not enable Magic Link, OAuth, email OTP, admin, SSO, or Expo plugins in this spike.
- The current Better Auth advisory list contains plugin-specific issues. None of the affected optional plugins are enabled by the proposed username/password configuration. Recheck advisories before every Better Auth upgrade.
- `npm ci` reports ESLint 9.39.5 as deprecated. This is a maintenance warning rather than an audit vulnerability. A major ESLint change is not part of FND-01 and requires a separate compatibility review.
- npm reported unapproved install scripts after `npm ci`; explicit `prisma generate` succeeded and is retained in CI. The install-script policy should be reviewed separately rather than broadly approving scripts during this task.

## Better Auth / Next.js / Prisma gate

The durable compatibility spike lives under `src/__tests__/compatibility/` and uses a dedicated local database and schema fixture. It does not alter the production Prisma schema or migration history.

Verified with Better Auth 1.7.25, Prisma 6.19.3, Next 16.4.6 contract exports, and PostgreSQL 16:

1. Prisma Client generation from the reviewed Better Auth fixture schema.
2. Prisma adapter operation with `provider: 'postgresql'` and `transaction: true`.
3. Username normalization and sign-in through the official username plugin.
4. Creation of two database-backed sessions.
5. Revocation of all sessions and rejection of a previously valid cookie.
6. App Router `GET`/`POST` handler creation through `toNextJsHandler`.
7. Session cookie attributes `HttpOnly`, `Secure`, and `SameSite=Lax`.
8. Atomic password-hash replacement, session revocation, and recovery-credential rotation in one Prisma transaction using Better Auth's public `hashPassword` export.
9. The old password fails and the new password succeeds after recovery rotation.

### Username-only product caveat

Better Auth's username plugin extends its email/password authenticator. Its schema requires an email column and its sign-up endpoint requires an email value. Dietyaar must therefore create an opaque internal synthetic address (for example, a random identifier under the reserved `.invalid` namespace) inside the identity provider boundary. It must never collect, display, send to, or treat that value as a user's email. Username remains the public credential and canonical lookup input.

This caveat does not revive email authentication or recovery. IDN-01 must encapsulate it behind `IdentityService`, disable unused enumeration-sensitive endpoints, use generic errors, and add explicit tests that no user email is accepted or exposed.

### Recovery extension boundary

The spike demonstrates feasibility without patching Better Auth internals: Better Auth's public password hashing API produces a credential hash compatible with username sign-in, while Prisma owns the application transaction that rotates the recovery credential and removes sessions. IDN-03 must still add concurrency/idempotency constraints, constant-time recovery-code verification, persistent throttling, and real migration review. Those are later-task acceptance criteria, not FND-01 features.

## Commands and observed results

| Command                                                  | Result                                                                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --no-audit --no-fund`                            | Pass after registry access; 598 packages installed from the synchronized lockfile.                                           |
| `npm audit --json`                                       | Pass; zero known vulnerabilities at every severity.                                                                          |
| `npx prisma generate`                                    | Pass for the application schema.                                                                                             |
| `npm run test:compat` with isolated `FND01_DATABASE_URL` | Pass; 1 file, 3 tests.                                                                                                       |
| `npm run lint:all`                                       | Pass after all FND-01 changes: ESLint, RTL smoke check, TypeScript, and Prettier.                                            |
| `npm test`                                               | Pass outside the sandbox process restriction: 4 files and 76 tests. The initial sandbox failure was `spawn EPERM`.           |
| `npm run build`                                          | Pass outside the sandbox process restriction; `/fa`, `/en`, and `.next/standalone/server.js` were generated.                 |
| `docker build -t dietyaar:fnd01 ...`                     | Not completed: Docker Hub returned HTTP 403 for the external `docker/dockerfile:1.7` frontend before application evaluation. |

## References reviewed

- Installed Next.js 16.4.6 documentation under `node_modules/next/dist/docs/`, especially installation, authentication, data security, Route Handlers, Server Actions, proxy, and testing guidance.
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [Next.js support policy](https://nextjs.org/support-policy)
- [Prisma 6 requirements](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v6)
- [Better Auth username plugin](https://better-auth.com/docs/plugins/username)
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth email/password and session revocation](https://better-auth.com/docs/authentication/email-password)
- [Better Auth security advisories](https://github.com/better-auth/better-auth/security/advisories)

## Decision

**FND-01 passes** for the pinned local/CI baseline and the preferred Better Auth architecture. No custom-cookie or admin-created-user model is needed. The local Docker image build remains unverified only because Docker Hub rejected access to the existing Dockerfile frontend; the GitHub CI Docker job must supply that external evidence before a release gate can pass. A later real compatibility failure would reopen this decision.
