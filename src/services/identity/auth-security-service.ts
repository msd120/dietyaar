import 'server-only';
import { createHash } from 'node:crypto';
import { AuthThrottlePurpose } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export const authThrottlePurpose = {
  registration: AuthThrottlePurpose.REGISTRATION,
  login: AuthThrottlePurpose.LOGIN,
  recovery: AuthThrottlePurpose.RECOVERY,
} as const;

function hashSubject(subject: string) {
  return createHash('sha256').update(subject.trim().toLowerCase()).digest('hex');
}

export async function canAttemptAuth(input: {
  purpose: AuthThrottlePurpose;
  subject: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const record = await prisma.authThrottle.findUnique({
    where: {
      purpose_subjectHash: { purpose: input.purpose, subjectHash: hashSubject(input.subject) },
    },
  });
  return !record?.blockedUntil || record.blockedUntil <= now;
}

export async function recordAuthFailure(input: {
  purpose: AuthThrottlePurpose;
  subject: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const subjectHash = hashSubject(input.subject);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.authThrottle.findUnique({
      where: { purpose_subjectHash: { purpose: input.purpose, subjectHash } },
    });
    if (!existing || now.getTime() - existing.windowStarted.getTime() >= WINDOW_MS) {
      return tx.authThrottle.upsert({
        where: { purpose_subjectHash: { purpose: input.purpose, subjectHash } },
        create: { purpose: input.purpose, subjectHash, windowStarted: now, attempts: 1 },
        update: { windowStarted: now, attempts: 1, blockedUntil: null },
      });
    }

    const attempts = existing.attempts + 1;
    return tx.authThrottle.update({
      where: { purpose_subjectHash: { purpose: input.purpose, subjectHash } },
      data: {
        attempts,
        blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null,
      },
    });
  });
}

export async function recordAuthSuccess(input: {
  purpose: AuthThrottlePurpose;
  subject: string;
  userId?: string;
}) {
  const subjectHash = hashSubject(input.subject);
  await prisma.$transaction([
    prisma.authThrottle.deleteMany({ where: { purpose: input.purpose, subjectHash } }),
    prisma.authAuditEvent.create({
      data: { userId: input.userId, event: input.purpose, outcome: 'SUCCESS' },
    }),
  ]);
}

/** Clears a second, privacy-preserving throttle key without creating another audit event. */
export async function clearAuthThrottle(input: { purpose: AuthThrottlePurpose; subject: string }) {
  const subjectHash = hashSubject(input.subject);
  await prisma.authThrottle.deleteMany({ where: { purpose: input.purpose, subjectHash } });
}

export async function recordAuthAudit(input: {
  purpose: AuthThrottlePurpose;
  outcome: 'FAILURE' | 'BLOCKED';
}) {
  await prisma.authAuditEvent.create({ data: { event: input.purpose, outcome: input.outcome } });
}
