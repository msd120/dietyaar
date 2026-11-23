import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import { env } from '@/lib/env';
import { getAuthOriginConfiguration } from '@/lib/auth-origin';
import { prisma } from '@/lib/prisma';

const originConfiguration = getAuthOriginConfiguration(env);

export const auth = betterAuth({
  baseURL: originConfiguration.baseURL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: originConfiguration.trustedOrigins,
  advanced: {
    // Vercel preview host validation uses the request URL and exact allowlist.
    // Do not trust caller-controlled x-forwarded-* headers.
    trustedProxyHeaders: false,
  },
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: false },
  user: { deleteUser: { enabled: true } },
  // Registration is exposed only through IdentityService. The adapter needs an
  // email column, but Dietyaar never accepts or exposes email as a credential.
  disabledPaths: ['/is-username-available', '/sign-up/email'],
  plugins: [username({ immutableUsername: true })],
});
