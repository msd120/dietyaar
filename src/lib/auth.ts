import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL, 'http://192.168.44.7:3000'],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: false },
  user: { deleteUser: { enabled: true } },
  // Registration is exposed only through IdentityService. The adapter needs an
  // email column, but Dietyaar never accepts or exposes email as a credential.
  disabledPaths: ['/is-username-available', '/sign-up/email'],
  plugins: [username({ immutableUsername: true })],
});
