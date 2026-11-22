import 'server-only';
import { JobType, type Job, type Prisma } from '@prisma/client';
import { claimNextJob, failJob, succeedJob } from '@/services/jobs/job-service';

export type JobHandler = (job: Job) => Promise<Prisma.InputJsonValue>;
export type JobHandlers = Partial<Record<JobType, JobHandler>>;

const retryableCodes = new Set([
  'PROVIDER_RATE_LIMIT',
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'MEDIA_DELETE_FAILED',
]);

function safeError(error: unknown) {
  if (!(error instanceof Error)) return 'UNKNOWN';
  const known = new Set([
    'FEATURE_DISABLED',
    'NO_CONSENT',
    'QUOTA_EXCEEDED',
    'MEDIA_INVALID',
    'PROVIDER_AUTH',
    'PROVIDER_RATE_LIMIT',
    'PROVIDER_TIMEOUT',
    'PROVIDER_UNAVAILABLE',
    'OUTPUT_INVALID',
    'OUTPUT_UNSAFE',
    'STALE_REVISION',
    'CANCELED',
    'MEDIA_DELETE_FAILED',
  ]);
  return known.has(error.message) ? error.message : 'UNKNOWN';
}

export async function processNextJob(input: { workerId: string; handlers: JobHandlers }) {
  const job = await claimNextJob({ workerId: input.workerId });
  if (!job) return false;
  const handler = input.handlers[job.type];
  if (!handler) {
    await failJob({
      jobId: job.id,
      workerId: input.workerId,
      safeErrorCode: 'FEATURE_DISABLED',
      retryable: false,
    });
    return true;
  }
  try {
    const result = await handler(job);
    await succeedJob({ jobId: job.id, workerId: input.workerId, result });
  } catch (error) {
    const code = safeError(error);
    await failJob({
      jobId: job.id,
      workerId: input.workerId,
      safeErrorCode: code,
      retryable: retryableCodes.has(code),
    });
  }
  return true;
}
