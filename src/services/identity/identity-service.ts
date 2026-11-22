import 'server-only';
import { randomUUID } from 'node:crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRecoveryCode, createRecoveryCredential } from '@/services/identity/recovery-code';

type RegisterWithUsernameInput = {
  username: string;
  password: string;
  displayName?: string;
};

type LoginWithUsernameInput = {
  username: string;
  password: string;
};

function internalEmail(username: string) {
  const encodedUsername = Buffer.from(username, 'utf8').toString('base64url');
  return `dietyaar-${encodedUsername}-${randomUUID()}@user.invalid`;
}

/**
 * Creates a public username/password account without collecting an email
 * address. Better Auth's username plugin still requires an email column, so
 * the identity boundary supplies a non-routable internal value.
 */
export async function registerWithUsername(input: RegisterWithUsernameInput) {
  const response = await auth.api.signUpEmail({
    asResponse: true,
    body: {
      name: input.displayName?.trim() || input.username,
      email: internalEmail(input.username),
      username: input.username,
      password: input.password,
    },
  });
  if (!response.ok) return response;

  const payload = (await response.clone().json()) as { user?: { id?: string } };
  const userId = payload.user?.id;
  if (!userId) throw new Error('Registration did not return a user identity');

  const recoveryCode = createRecoveryCode();
  try {
    await createRecoveryCredential(userId, recoveryCode);
  } catch (error) {
    // A registration without a recovery credential would violate the identity
    // contract. Compensate by removing the newly-created identity and cascades.
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    throw error;
  }

  return Response.json(
    { recoveryCode },
    { status: response.status, statusText: response.statusText, headers: response.headers },
  );
}

export async function loginWithUsername(input: LoginWithUsernameInput) {
  return auth.api.signInUsername({
    asResponse: true,
    body: { username: input.username, password: input.password },
  });
}

export async function deleteCurrentAccount(input: { headers: Headers; password: string }) {
  return auth.api.deleteUser({
    asResponse: true,
    headers: input.headers,
    body: { password: input.password },
  });
}
