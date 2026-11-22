import { randomUUID } from 'node:crypto';
import { JobState, JobType, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const prisma = new PrismaClient();
let jobs: typeof import('@/services/jobs/job-service');

beforeAll(async () => {
  process.env.WORKER_ENABLED = 'true';
  vi.resetModules();
  jobs = await import('@/services/jobs/job-service');
});

afterAll(async () => {
  delete process.env.WORKER_ENABLED;
  await prisma.$disconnect();
});

describe('PostgreSQL job queue', () => {
  it('enqueues idempotently, claims with a lease, and recovers an expired lease', async () => {
    const userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Worker user',
        email: `${userId}@user.invalid`,
        username: `worker_${userId.replaceAll('-', '').slice(0, 12)}`,
      },
    });
    try {
      const first = await jobs.enqueueJob({
        userId,
        type: JobType.SUMMARY_REBUILD,
        payload: { localDate: '2026-11-22' },
        idempotencyKey: `summary:${userId}:2026-11-22`,
      });
      const duplicate = await jobs.enqueueJob({
        userId,
        type: JobType.SUMMARY_REBUILD,
        payload: { localDate: '2026-11-22' },
        idempotencyKey: `summary:${userId}:2026-11-22`,
      });
      expect(duplicate.id).toBe(first.id);

      const now = new Date('2026-11-22T08:00:00.000Z');
      await prisma.job.update({ where: { id: first.id }, data: { runAfter: now } });
      const claimed = await jobs.claimNextJob({ workerId: 'worker-a', now, leaseMs: 1000 });
      expect(claimed).toMatchObject({ id: first.id, state: JobState.RUNNING, attempts: 1 });
      expect(await jobs.claimNextJob({ workerId: 'worker-b', now })).toBeNull();

      await jobs.recoverExpiredJobs(new Date('2026-11-22T08:00:02.000Z'));
      const recovered = await jobs.claimNextJob({
        workerId: 'worker-b',
        now: new Date('2026-11-22T08:00:02.000Z'),
      });
      expect(recovered).toMatchObject({ id: first.id, attempts: 2 });
      await jobs.succeedJob({ jobId: first.id, workerId: 'worker-b', result: { rebuilt: true } });
      await expect(jobs.getOwnedJob(userId, first.id)).resolves.toMatchObject({
        state: JobState.SUCCEEDED,
      });
    } finally {
      await prisma.user.delete({ where: { id: userId } });
    }
  });
});
