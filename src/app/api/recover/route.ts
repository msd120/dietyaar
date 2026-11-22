import { z } from 'zod';
import {
  authThrottlePurpose,
  canAttemptAuth,
  clearAuthThrottle,
  recordAuthAudit,
  recordAuthFailure,
  recordAuthSuccess,
} from '@/services/identity/auth-security-service';
import { recoverWithCode } from '@/services/identity/recovery-code';

const recoverySchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,32}$/),
  code: z.string().trim().min(32).max(48),
  password: z.string().min(12).max(128),
});

function ipSubject(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return `ip:${forwardedFor?.split(',')[0]?.trim() || 'unknown'}`;
}

function genericFailure(status = 400) {
  return Response.json({ error: 'RECOVERY_FAILED' }, { status });
}

export async function POST(request: Request) {
  const parsed = recoverySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return genericFailure();

  const purpose = authThrottlePurpose.recovery;
  const accountSubject = `username:${parsed.data.username}`;
  const requestIpSubject = ipSubject(request);
  try {
    const [accountAllowed, ipAllowed] = await Promise.all([
      canAttemptAuth({ purpose, subject: accountSubject }),
      canAttemptAuth({ purpose, subject: requestIpSubject }),
    ]);
    if (!accountAllowed || !ipAllowed) {
      await recordAuthAudit({ purpose, outcome: 'BLOCKED' });
      return Response.json(
        { error: 'RECOVERY_FAILED' },
        { status: 429, headers: { 'Retry-After': '900' } },
      );
    }

    const recovered = await recoverWithCode({
      username: parsed.data.username,
      code: parsed.data.code,
      newPassword: parsed.data.password,
    });
    if (!recovered) {
      await Promise.all([
        recordAuthFailure({ purpose, subject: accountSubject }),
        recordAuthFailure({ purpose, subject: requestIpSubject }),
        recordAuthAudit({ purpose, outcome: 'FAILURE' }),
      ]);
      return genericFailure();
    }

    await Promise.all([
      recordAuthSuccess({ purpose, subject: accountSubject, userId: recovered.userId }),
      clearAuthThrottle({ purpose, subject: requestIpSubject }),
    ]).catch(() => undefined);
    return Response.json({ replacementCode: recovered.replacementCode });
  } catch {
    await Promise.all([
      recordAuthFailure({ purpose, subject: accountSubject }),
      recordAuthFailure({ purpose, subject: requestIpSubject }),
      recordAuthAudit({ purpose, outcome: 'FAILURE' }),
    ]).catch(() => undefined);
    return genericFailure();
  }
}
