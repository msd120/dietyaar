import 'server-only';
import {
  AiAnalysisState,
  AiPurpose,
  ConsentPurpose,
  JobType,
  MediaPurpose,
  MediaState,
  type Prisma,
} from '@prisma/client';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { enqueueJob } from '@/services/jobs/job-service';

export const AI_SAFE_ERRORS = [
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
  'UNKNOWN',
] as const;

function purposeConfiguration(purpose: AiPurpose) {
  if (purpose === AiPurpose.PLAN_IMAGE)
    return {
      enabled: env.AI_PLAN_IMAGE_ENABLED,
      consent: ConsentPurpose.PLAN_IMAGE,
      jobType: JobType.PLAN_IMAGE_EXTRACT,
      mediaPurpose: MediaPurpose.PLAN_IMAGE,
      dailyLimit: 5,
    };
  if (purpose === AiPurpose.MEAL_IMAGE)
    return {
      enabled: env.AI_MEAL_PHOTO_ENABLED,
      consent: ConsentPurpose.MEAL_IMAGE,
      jobType: JobType.MEAL_PHOTO_RECOGNIZE,
      mediaPurpose: MediaPurpose.MEAL_IMAGE,
      dailyLimit: 10,
    };
  return {
    enabled: env.AI_REFLECTION_ENABLED,
    consent: ConsentPurpose.AI_REFLECTION,
    jobType: JobType.AI_REFLECTION,
    mediaPurpose: null,
    dailyLimit: 1,
  };
}

function assertPurposeMatchesDraft(
  purpose: AiPurpose,
  draftType: 'PLAN_DRAFT' | 'MEAL_DRAFT' | 'REFLECTION',
) {
  const valid =
    (purpose === AiPurpose.PLAN_IMAGE && draftType === 'PLAN_DRAFT') ||
    (purpose === AiPurpose.MEAL_IMAGE && draftType === 'MEAL_DRAFT') ||
    (purpose === AiPurpose.REFLECTION && draftType === 'REFLECTION');
  if (!valid) throw new Error('MEDIA_INVALID');
}

async function requireCurrentDraft(input: {
  userId: string;
  draftType: 'PLAN_DRAFT' | 'MEAL_DRAFT' | 'REFLECTION';
  draftId: string;
  draftRevision: number;
}) {
  if (input.draftType === 'PLAN_DRAFT') {
    const draft = await prisma.planDraft.findFirst({
      where: { id: input.draftId, userId: input.userId, revision: input.draftRevision },
      select: { id: true },
    });
    if (!draft) throw new Error('STALE_REVISION');
    return;
  }
  if (input.draftType === 'MEAL_DRAFT') {
    const draft = await prisma.mealDraft.findFirst({
      where: { id: input.draftId, userId: input.userId, revision: input.draftRevision },
      select: { id: true },
    });
    if (!draft) throw new Error('STALE_REVISION');
    return;
  }
  const reflection = await prisma.reflection.findFirst({
    where: {
      id: input.draftId,
      userId: input.userId,
      sourceRevision: input.draftRevision,
    },
    select: { id: true },
  });
  if (!reflection) throw new Error('STALE_REVISION');
}

export async function requestAiAnalysis(input: {
  userId: string;
  purpose: AiPurpose;
  draftType: 'PLAN_DRAFT' | 'MEAL_DRAFT' | 'REFLECTION';
  draftId: string;
  draftRevision: number;
  inputMediaId?: string;
}) {
  assertPurposeMatchesDraft(input.purpose, input.draftType);
  const config = purposeConfiguration(input.purpose);
  if (!config.enabled || !env.WORKER_ENABLED) throw new Error('FEATURE_DISABLED');
  const consent = await prisma.consent.findUnique({
    where: { userId_purpose: { userId: input.userId, purpose: config.consent } },
  });
  if (!consent?.grantedAt || consent.revokedAt) throw new Error('NO_CONSENT');
  await requireCurrentDraft(input);
  if (config.mediaPurpose) {
    const media = await prisma.mediaAsset.findFirst({
      where: {
        id: input.inputMediaId,
        userId: input.userId,
        purpose: config.mediaPurpose,
        state: MediaState.READY,
      },
    });
    if (!media) throw new Error('MEDIA_INVALID');
  }
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const used = await prisma.aiAnalysis.count({
    where: { userId: input.userId, purpose: input.purpose, createdAt: { gte: dayStart } },
  });
  if (used >= config.dailyLimit) throw new Error('QUOTA_EXCEEDED');
  const idempotencyKey = `ai:${input.purpose}:${input.draftId}:${input.draftRevision}`;
  const payload = {
    schemaVersion: 1,
    purpose: input.purpose,
    draftType: input.draftType,
    draftId: input.draftId,
    draftRevision: input.draftRevision,
    inputMediaId: input.inputMediaId ?? null,
  } satisfies Prisma.InputJsonObject;
  const job = await enqueueJob({
    userId: input.userId,
    type: config.jobType,
    payload,
    idempotencyKey,
  });
  return prisma.aiAnalysis.upsert({
    where: { jobId: job.id },
    create: {
      userId: input.userId,
      jobId: job.id,
      purpose: input.purpose,
      provider: env.AI_PROVIDER ?? 'disabled',
      model: env.AI_PROVIDER_MODEL ?? 'disabled',
      inputMediaId: input.inputMediaId,
      draftType: input.draftType,
      draftId: input.draftId,
      draftRevision: input.draftRevision,
      promptVersion: 'v1',
    },
    update: {},
  });
}

export async function storeValidatedAiProposal(input: {
  userId: string;
  analysisId: string;
  result: Prisma.InputJsonValue;
  latencyMs?: number;
}) {
  const analysis = await prisma.aiAnalysis.findFirst({
    where: {
      id: input.analysisId,
      userId: input.userId,
      state: { in: [AiAnalysisState.QUEUED, AiAnalysisState.RUNNING] },
    },
  });
  if (!analysis) throw new Error('CANCELED');
  const draftType = analysis.draftType as 'PLAN_DRAFT' | 'MEAL_DRAFT' | 'REFLECTION';
  assertPurposeMatchesDraft(analysis.purpose, draftType);
  const config = purposeConfiguration(analysis.purpose);
  if (!config.enabled) throw new Error('FEATURE_DISABLED');
  const consent = await prisma.consent.findUnique({
    where: { userId_purpose: { userId: input.userId, purpose: config.consent } },
  });
  if (!consent?.grantedAt || consent.revokedAt) throw new Error('NO_CONSENT');
  await requireCurrentDraft({
    userId: input.userId,
    draftType,
    draftId: analysis.draftId,
    draftRevision: analysis.draftRevision,
  });
  return prisma.$transaction([
    prisma.job.update({ where: { id: analysis.jobId }, data: { resultJson: input.result } }),
    prisma.aiAnalysis.update({
      where: { id: analysis.id },
      data: {
        state: AiAnalysisState.SUCCEEDED,
        latencyMs: input.latencyMs,
        completedAt: new Date(),
      },
    }),
  ]);
}

export async function cancelAiWorkForPurpose(userId: string, purpose: AiPurpose) {
  const analyses = await prisma.aiAnalysis.findMany({
    where: {
      userId,
      purpose,
      state: { in: [AiAnalysisState.QUEUED, AiAnalysisState.RUNNING] },
    },
    select: { id: true, jobId: true },
  });
  if (analyses.length === 0) return 0;
  await prisma.$transaction([
    prisma.aiAnalysis.updateMany({
      where: { id: { in: analyses.map((item) => item.id) } },
      data: { state: AiAnalysisState.CANCELED, safeErrorCode: 'CANCELED' },
    }),
    prisma.job.updateMany({
      where: { id: { in: analyses.map((item) => item.jobId) } },
      data: { state: 'CANCELED', leaseOwner: null, leaseUntil: null },
    }),
  ]);
  return analyses.length;
}
