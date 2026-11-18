import { randomUUID } from 'node:crypto';

import { PrismaClient } from '../../../node_modules/.generated/better-auth-fnd01';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { hashPassword } from 'better-auth/crypto';
import { betterAuth } from 'better-auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { username } from 'better-auth/plugins';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const databaseUrl = process.env.FND01_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function cookieHeader(response: Response): string {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('Expected Better Auth to set a session cookie');

  return setCookie
    .split(',')
    .map((part) => part.trim().split(';', 1)[0])
    .join('; ');
}

function authRequest(path: string, body: unknown, cookie?: string) {
  return new Request(`http://localhost:3000/api/auth${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describeWithDatabase('FND-01 Better Auth / Prisma compatibility', () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const auth = betterAuth({
    appName: 'Dietyaar FND-01 spike',
    baseURL: 'http://localhost:3000',
    secret: 'fnd01-only-secret-with-at-least-32-characters',
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
      transaction: true,
    }),
    advanced: { useSecureCookies: true },
    emailAndPassword: { enabled: true },
    plugins: [username({ displayUsername: false, immutableUsername: true })],
  });

  beforeEach(async () => {
    await prisma.recoveryCredential.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates username sessions and revokes all sessions', async () => {
    const signUp = await auth.handler(
      authRequest('/sign-up/email', {
        name: 'Spike user',
        email: `fnd01-${randomUUID()}@invalid.dietyaar`,
        username: 'Spike_User',
        password: 'Fnd01-compatible-password-123',
      }),
    );

    expect(signUp.status).toBe(200);
    expect(signUp.headers.get('set-cookie')).toMatch(/HttpOnly/i);
    expect(signUp.headers.get('set-cookie')).toMatch(/SameSite=Lax/i);
    expect(signUp.headers.get('set-cookie')).toMatch(/Secure/i);
    const firstCookie = cookieHeader(signUp);

    const signIn = await auth.handler(
      authRequest('/sign-in/username', {
        username: 'spike_user',
        password: 'Fnd01-compatible-password-123',
      }),
    );

    expect(signIn.status).toBe(200);
    const secondCookie = cookieHeader(signIn);
    expect(await prisma.session.count()).toBe(2);

    const revoke = await auth.handler(authRequest('/revoke-sessions', {}, secondCookie));

    expect(revoke.status).toBe(200);
    expect(await prisma.session.count()).toBe(0);

    const staleSession = await auth.handler(
      new Request('http://localhost:3000/api/auth/get-session', {
        headers: { cookie: firstCookie },
      }),
    );
    expect(await staleSession.json()).toBeNull();
  });

  it('exposes the App Router GET/POST handler contract', () => {
    const handlers = toNextJsHandler(auth);

    expect(handlers.GET).toBeTypeOf('function');
    expect(handlers.POST).toBeTypeOf('function');
  });

  it('supports an atomic recovery-code password rotation without vendor patches', async () => {
    const email = `fnd01-${randomUUID()}@invalid.dietyaar`;
    const oldPassword = 'Fnd01-old-password-123';
    const newPassword = 'Fnd01-new-password-456';
    const recoveryCodeHash = await hashPassword('recovery-code-fixture');

    const signUp = await auth.handler(
      authRequest('/sign-up/email', {
        name: 'Recovery spike user',
        email,
        username: 'recovery_user',
        password: oldPassword,
      }),
    );
    expect(signUp.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({
      where: { username: 'recovery_user' },
    });
    await prisma.recoveryCredential.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        codeHash: recoveryCodeHash,
      },
    });

    const nextRecoveryHash = await hashPassword('replacement-code-fixture');
    const nextPasswordHash = await hashPassword(newPassword);
    await prisma.$transaction(async (tx) => {
      const credential = await tx.recoveryCredential.findUniqueOrThrow({
        where: { userId: user.id },
      });
      expect(credential.consumedAt).toBeNull();

      await tx.account.updateMany({
        where: { userId: user.id, providerId: 'credential' },
        data: { password: nextPasswordHash },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.recoveryCredential.update({
        where: { userId: user.id },
        data: {
          codeHash: nextRecoveryHash,
          consumedAt: new Date(),
        },
      });
    });

    const oldSignIn = await auth.handler(
      authRequest('/sign-in/username', {
        username: 'recovery_user',
        password: oldPassword,
      }),
    );
    expect(oldSignIn.status).toBe(401);

    const newSignIn = await auth.handler(
      authRequest('/sign-in/username', {
        username: 'recovery_user',
        password: newPassword,
      }),
    );
    expect(newSignIn.status).toBe(200);
    expect(await prisma.session.count()).toBe(1);
  });
});
