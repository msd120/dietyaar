import { z } from 'zod';
import {
  authThrottlePurpose,
  canAttemptAuth,
  clearAuthThrottle,
  recordAuthAudit,
  recordAuthFailure,
  recordAuthSuccess,
} from '@/services/identity/auth-security-service';
import { loginWithUsername } from '@/services/identity/identity-service';

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,32}$/),
  password: z.string().min(1).max(128),
});

function ipSubject(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return `ip:${forwardedFor?.split(',')[0]?.trim() || 'unknown'}`;
}

function genericFailure(status = 400) {
  return Response.json({ error: 'LOGIN_FAILED' }, { status });
}

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return genericFailure();

  const purpose = authThrottlePurpose.login;
  const accountSubject = `username:${parsed.data.username}`;
  const requestIpSubject = ipSubject(request);
  try {
    const [accountAllowed, ipAllowed] = await Promise.all([
      canAttemptAuth({ purpose, subject: accountSubject }),
      canAttemptAuth({ purpose, subject: requestIpSubject }),
    ]);
    if (!accountAllowed || !ipAllowed) {
      await recordAuthAudit({ purpose, outcome: 'BLOCKED' });
      return genericFailure(429);
    }

    const response = await loginWithUsername(parsed.data);
    if (!response.ok) {
      await Promise.all([
        recordAuthFailure({ purpose, subject: accountSubject }),
        recordAuthFailure({ purpose, subject: requestIpSubject }),
        recordAuthAudit({ purpose, outcome: 'FAILURE' }),
      ]);
      return genericFailure();
    }

    const payload = (await response
      .clone()
      .json()
      .catch(() => null)) as { user?: { id?: string } } | null;
    await Promise.all([
      recordAuthSuccess({ purpose, subject: accountSubject, userId: payload?.user?.id }),
      clearAuthThrottle({ purpose, subject: requestIpSubject }),
    ]).catch(() => undefined);
    return response;
  } catch {
    await Promise.all([
      recordAuthFailure({ purpose, subject: accountSubject }),
      recordAuthFailure({ purpose, subject: requestIpSubject }),
      recordAuthAudit({ purpose, outcome: 'FAILURE' }),
    ]).catch(() => undefined);
    return genericFailure();
  }
}
