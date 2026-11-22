import 'server-only';
import { JobState, type Job, type JobType, Prisma } from '@prisma/client';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export async function enqueueJob(input: {
  userId: string;
  type: JobType;
  payload: Prisma.InputJsonValue;
  idempotencyKey: string;
  maxAttempts?: number;
  runAfter?: Date;
}) {
  if (!env.WORKER_ENABLED) throw new Error('FEATURE_DISABLED');
  return prisma.job.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      userId: input.userId,
      type: input.type,
      payloadJson: input.payload,
      idempotencyKey: input.idempotencyKey,
      maxAttempts: input.maxAttempts ?? 3,
      runAfter: input.runAfter,
    },
    update: {},
  });
}

export async function recoverExpiredJobs(now = new Date()) {
  const exhausted = await prisma.job.updateMany({
    where: {
      state: JobState.RUNNING,
      leaseUntil: { lte: now },
      attempts: { gte: prisma.job.fields.maxAttempts },
    },
    data: {
      state: JobState.FAILED,
      leaseOwner: null,
      leaseUntil: null,
      safeErrorCode: 'LEASE_EXHAUSTED',
    },
  });
  const retryable = await prisma.$executeRaw(Prisma.sql`
    UPDATE "Job"
    SET "state" = 'RETRY_WAIT'::"JobState",
        "runAfter" = ${now},
        "leaseOwner" = NULL,
        "leaseUntil" = NULL,
        "safeErrorCode" = 'LEASE_EXPIRED',
        "updatedAt" = ${now}
    WHERE "state" = 'RUNNING'::"JobState"
      AND "leaseUntil" <= ${now}
      AND "attempts" < "maxAttempts"
  `);
  return { exhausted: exhausted.count, retryable };
}

export async function claimNextJob(input: { workerId: string; now?: Date; leaseMs?: number }) {
  if (!env.WORKER_ENABLED) throw new Error('FEATURE_DISABLED');
  const now = input.now ?? new Date();
  await recoverExpiredJobs(now);
  const leaseUntil = new Date(now.getTime() + (input.leaseMs ?? 30_000));
  const jobs = await prisma.$queryRaw<Job[]>(Prisma.sql`
    UPDATE "Job"
    SET "state" = 'RUNNING'::"JobState",
        "leaseOwner" = ${input.workerId},
        "leaseUntil" = ${leaseUntil},
        "attempts" = "attempts" + 1,
        "updatedAt" = ${now}
    WHERE "id" = (
      SELECT "id" FROM "Job"
      WHERE "state" IN ('QUEUED'::"JobState", 'RETRY_WAIT'::"JobState")
        AND "runAfter" <= ${now}
      ORDER BY "runAfter", "id"
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `);
  return jobs[0] ?? null;
}

export async function heartbeatJob(input: {
  jobId: string;
  workerId: string;
  now?: Date;
  leaseMs?: number;
}) {
  const now = input.now ?? new Date();
  const result = await prisma.job.updateMany({
    where: { id: input.jobId, state: JobState.RUNNING, leaseOwner: input.workerId },
    data: { leaseUntil: new Date(now.getTime() + (input.leaseMs ?? 30_000)) },
  });
  if (result.count !== 1) throw new Error('LEASE_LOST');
}

export async function succeedJob(input: {
  jobId: string;
  workerId: string;
  result: Prisma.InputJsonValue;
}) {
  const updated = await prisma.job.updateMany({
    where: { id: input.jobId, state: JobState.RUNNING, leaseOwner: input.workerId },
    data: {
      state: JobState.SUCCEEDED,
      resultJson: input.result,
      leaseOwner: null,
      leaseUntil: null,
      safeErrorCode: null,
    },
  });
  if (updated.count !== 1) throw new Error('LEASE_LOST');
}

export async function failJob(input: {
  jobId: string;
  workerId: string;
  safeErrorCode: string;
  retryable: boolean;
  now?: Date;
}) {
  const job = await prisma.job.findFirst({
    where: { id: input.jobId, state: JobState.RUNNING, leaseOwner: input.workerId },
  });
  if (!job) throw new Error('LEASE_LOST');
  const retry = input.retryable && job.attempts < job.maxAttempts;
  const delayMs = Math.min(60_000, 1000 * 2 ** Math.max(0, job.attempts - 1));
  await prisma.job.update({
    where: { id: job.id },
    data: {
      state: retry ? JobState.RETRY_WAIT : JobState.FAILED,
      runAfter: retry ? new Date((input.now ?? new Date()).getTime() + delayMs) : job.runAfter,
      leaseOwner: null,
      leaseUntil: null,
      safeErrorCode: input.safeErrorCode,
    },
  });
}

export async function cancelOwnedJob(input: { userId: string; jobId: string }) {
  const result = await prisma.job.updateMany({
    where: {
      id: input.jobId,
      userId: input.userId,
      state: { in: [JobState.QUEUED, JobState.RETRY_WAIT, JobState.RUNNING] },
    },
    data: { state: JobState.CANCELED, leaseOwner: null, leaseUntil: null },
  });
  if (result.count !== 1) throw new Error('JOB_NOT_FOUND');
}

export async function getOwnedJob(userId: string, jobId: string) {
  return prisma.job.findFirst({ where: { id: jobId, userId } });
}
