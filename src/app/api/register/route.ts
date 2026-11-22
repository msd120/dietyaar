import { z } from 'zod';
import {
  authThrottlePurpose,
  canAttemptAuth,
  clearAuthThrottle,
  recordAuthAudit,
  recordAuthFailure,
  recordAuthSuccess,
} from '@/services/identity/auth-security-service';
import { registerWithUsername } from '@/services/identity/identity-service';

const registrationSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,32}$/),
  password: z.string().min(12).max(128),
});

function registrationIpSubject(request: Request) {
  // Our reverse proxy is responsible for replacing this header.  Do not store
  // it: AuthSecurityService hashes the derived value before it reaches Prisma.
  const forwardedFor = request.headers.get('x-forwarded-for');
  const address = forwardedFor?.split(',')[0]?.trim() || 'unknown';
  return `ip:${address}`;
}

function usernameSubject(username: string) {
  return `username:${username}`;
}

function blockedResponse() {
  return Response.json(
    { error: 'REGISTRATION_FAILED' },
    { status: 429, headers: { 'Retry-After': '900' } },
  );
}

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'INVALID_INPUT' }, { status: 400 });

  const purpose = authThrottlePurpose.registration;
  const accountSubject = usernameSubject(parsed.data.username);
  const ipSubject = registrationIpSubject(request);

  try {
    const [accountAllowed, ipAllowed] = await Promise.all([
      canAttemptAuth({ purpose, subject: accountSubject }),
      canAttemptAuth({ purpose, subject: ipSubject }),
    ]);
    if (!accountAllowed || !ipAllowed) {
      await recordAuthAudit({ purpose, outcome: 'BLOCKED' });
      return blockedResponse();
    }

    const response = await registerWithUsername(parsed.data);
    if (!response.ok) {
      await Promise.all([
        recordAuthFailure({ purpose, subject: accountSubject }),
        recordAuthFailure({ purpose, subject: ipSubject }),
        recordAuthAudit({ purpose, outcome: 'FAILURE' }),
      ]);
      // Better Auth can describe duplicate usernames. Do not pass that detail
      // to a public registration client.
      return Response.json({ error: 'REGISTRATION_FAILED' }, { status: 400 });
    }

    await Promise.all([
      recordAuthSuccess({ purpose, subject: accountSubject }),
      clearAuthThrottle({ purpose, subject: ipSubject }),
    ]).catch(() => undefined);
    return response;
  } catch {
    // Do not disclose whether a username already exists.
    await Promise.all([
      recordAuthFailure({ purpose, subject: accountSubject }),
      recordAuthFailure({ purpose, subject: ipSubject }),
      recordAuthAudit({ purpose, outcome: 'FAILURE' }),
    ]).catch(() => undefined);
    return Response.json({ error: 'REGISTRATION_FAILED' }, { status: 400 });
  }
}
