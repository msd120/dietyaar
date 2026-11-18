# Configuration and security boundaries

Status: FND-03 implementation contract, verified 2026-11-18.

## Runtime modes

Core mode requires only `DATABASE_URL`. Better Auth additionally requires
`BETTER_AUTH_SECRET` in production. Manual product behavior must not depend on
Supabase Storage, a worker, or AI credentials.

External capabilities use explicit kill switches and default to disabled:

| Capability     | Flag                    | Required configuration                                                 |
| -------------- | ----------------------- | ---------------------------------------------------------------------- |
| Private media  | `MEDIA_STORAGE_ENABLED` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` |
| Worker process | `WORKER_ENABLED`        | No provider credential by itself                                       |
| Plan-image AI  | `AI_PLAN_IMAGE_ENABLED` | Worker, private media, provider, base URL, API key, model              |
| Meal-photo AI  | `AI_MEAL_PHOTO_ENABLED` | Worker, private media, provider, base URL, API key, model              |
| AI reflection  | `AI_REFLECTION_ENABLED` | Worker, provider, base URL, API key, model                             |

Credentials may be present while their feature remains disabled. Enabling a
feature without its complete configuration fails environment validation at
startup. Consent, quota, revision, and worker-heartbeat checks remain later
feature responsibilities; configuration alone never authorizes processing.

## Secret boundary

- Server code imports validated values from `src/lib/env.ts`; client-facing
  code and provider implementations are separated by ESLint boundaries.
- Database URLs, Better Auth secrets, Supabase privileged keys, provider API
  keys, signed URLs, passwords, and tokens are redacted from structured logs.
- No privileged value uses a `NEXT_PUBLIC_` name. `.env` remains ignored and
  `.env.example` contains names and inert defaults only.
- Storage and AI adapters must live below server-only provider/service
  boundaries. The browser never receives a service-role key or AI key.

## Browser policy baseline

The application sends a restrictive CSP, frame denial, MIME sniffing denial,
strict referrer policy, HSTS, and a Permissions Policy. Development uses CSP
report-only and production enforces it. Camera, microphone, geolocation, and
payment access are disabled. Camera policy must remain disabled until MED-01
verifies a user-initiated capture flow and its exact browser endpoints.

Current browser connections are self-only. Supabase and AI provider endpoints
are server-side and must not be added to browser `connect-src` merely because
credentials exist.

## Verification

- `src/__tests__/env-schema.test.ts` covers core boot and enhanced-mode
  dependency failures.
- `src/__tests__/security-boundaries.test.ts` covers CSP, camera denial, and
  public-variable naming.
- Release verification scans tracked files and `.next/static` for the actual
  local secret values without printing them.
- `npm run lint:all` and `npm test` are required. On the current restricted
  Windows environment, Turbopack can stall and worker writes can return
  `EPERM`; a clean `next build --webpack` outside that restriction completed
  successfully. This is an environment limitation, not permission to change
  the project build architecture without review.
