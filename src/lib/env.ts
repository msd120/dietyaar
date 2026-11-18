import 'server-only';
import { parseServerEnv } from '@/lib/env-schema';
import type { Env } from '@/lib/env-schema';

/**
 * Validated environment. Import `env` instead of touching `process.env` in
 * server code; a missing or malformed variable fails at boot with a readable
 * message instead of deep inside Prisma or bcrypt.
 *
 * `next build` also evaluates this module, so CI and Docker builds must
 * provide a placeholder DATABASE_URL (see Dockerfile and .github/workflows).
 */

function loadEnv(): Env {
  return parseServerEnv(process.env);
}

export const env = loadEnv();
