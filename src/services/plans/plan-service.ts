import 'server-only';
import { PlanDraftState, PlanSourceType, PlanVersionStatus, Prisma } from '@prisma/client';
import { hasTimelineConflict, type PlanInterval } from '@/domain/plans/timeline';
import { parseStructuredPlan } from '@/domain/plans/structured-plan';
import { prisma } from '@/lib/prisma';

export async function createManualPlanDraft(userId: string, title?: string) {
  return prisma.planDraft.create({
    data: { userId, title: title?.trim() || null, sourceType: PlanSourceType.MANUAL },
  });
}

export async function clonePlanVersionToDraft(input: { userId: string; versionId: string }) {
  const version = await prisma.dietPlanVersion.findFirst({
    where: { id: input.versionId, userId: input.userId },
  });
  if (!version) throw new Error('PLAN_VERSION_NOT_FOUND');
  const snapshot =
    version.snapshot && typeof version.snapshot === 'object' && !Array.isArray(version.snapshot)
      ? version.snapshot
      : {};
  return prisma.planDraft.create({
    data: {
      userId: input.userId,
      sourceType: PlanSourceType.MANUAL,
      title: typeof snapshot.title === 'string' ? snapshot.title : null,
      sourceNote: typeof snapshot.sourceNote === 'string' ? snapshot.sourceNote : null,
      content: snapshot,
    },
  });
}

export async function getOwnedPlanDraft(userId: string, draftId: string) {
  return prisma.planDraft.findFirst({
    where: { id: draftId, userId, state: PlanDraftState.EDITING },
  });
}

export async function updateManualPlanDraft(input: {
  userId: string;
  draftId: string;
  revision: number;
  title?: string;
  sourceNote?: string;
  content: Prisma.InputJsonValue;
  medicalBoundary: boolean;
}) {
  const updated = await prisma.planDraft.updateMany({
    where: {
      id: input.draftId,
      userId: input.userId,
      revision: input.revision,
      state: PlanDraftState.EDITING,
    },
    data: {
      title: input.title?.trim() || null,
      sourceNote: input.sourceNote?.trim() || null,
      content: input.content,
      medicalBoundary: input.medicalBoundary,
      revision: { increment: 1 },
    },
  });
  if (updated.count !== 1) throw new Error('STALE_OR_UNOWNED_DRAFT');
  return prisma.planDraft.findFirstOrThrow({ where: { id: input.draftId, userId: input.userId } });
}

export async function activateManualPlan(input: {
  userId: string;
  draftId: string;
  revision: number;
  effectiveFrom: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      const draft = await tx.planDraft.findFirst({
        where: { id: input.draftId, userId: input.userId },
      });
      if (!draft || draft.revision !== input.revision || draft.state !== PlanDraftState.EDITING) {
        throw new Error('STALE_OR_UNOWNED_DRAFT');
      }
      if (draft.medicalBoundary) throw new Error('MEDICAL_PLAN_BLOCKED');
      if (
        draft.content &&
        typeof draft.content === 'object' &&
        !Array.isArray(draft.content) &&
        draft.content.schemaVersion === 2 &&
        !parseStructuredPlan(draft.content)
      ) {
        throw new Error('INVALID_PLAN_STRUCTURE');
      }

      const versions = await tx.dietPlanVersion.findMany({ where: { userId: input.userId } });
      const openVersion = versions.find((version) => version.effectiveTo === null);
      if (
        openVersion &&
        openVersion.effectiveFrom.toISOString().slice(0, 10) >= input.effectiveFrom
      ) {
        throw new Error('PLAN_TIMELINE_CONFLICT');
      }
      if (openVersion) {
        const previousDay = new Date(`${input.effectiveFrom}T00:00:00.000Z`);
        previousDay.setUTCDate(previousDay.getUTCDate() - 1);
        await tx.dietPlanVersion.update({
          where: { id: openVersion.id },
          data: { effectiveTo: previousDay, status: PlanVersionStatus.HISTORICAL },
        });
      }
      const remainingVersions = versions.filter((version) => version.id !== openVersion?.id);
      const candidate: PlanInterval = {
        id: 'candidate',
        effectiveFrom: input.effectiveFrom,
        effectiveTo: null,
      };
      if (
        hasTimelineConflict(
          candidate,
          remainingVersions.map((version) => ({
            id: version.id,
            effectiveFrom: version.effectiveFrom.toISOString().slice(0, 10),
            effectiveTo: version.effectiveTo?.toISOString().slice(0, 10) ?? null,
          })),
        )
      ) {
        throw new Error('PLAN_TIMELINE_CONFLICT');
      }

      const version = await tx.dietPlanVersion.create({
        data: {
          userId: input.userId,
          status: PlanVersionStatus.ACTIVE,
          effectiveFrom: new Date(`${input.effectiveFrom}T00:00:00.000Z`),
          sourceType: draft.sourceType,
          snapshot: draft.content === null ? Prisma.JsonNull : draft.content,
        },
      });
      await tx.planDraft.update({
        where: { id: draft.id },
        data: { state: PlanDraftState.ACTIVATED, revision: { increment: 1 } },
      });
      return version;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function activateHistoricalPlanCorrection(input: {
  userId: string;
  draftId: string;
  revision: number;
  effectiveFrom: string;
  reason: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      const draft = await tx.planDraft.findFirst({
        where: { id: input.draftId, userId: input.userId, state: PlanDraftState.EDITING },
      });
      if (!draft || draft.revision !== input.revision) throw new Error('STALE_OR_UNOWNED_DRAFT');
      if (draft.medicalBoundary) throw new Error('MEDICAL_PLAN_BLOCKED');
      if (
        draft.content &&
        typeof draft.content === 'object' &&
        !Array.isArray(draft.content) &&
        draft.content.schemaVersion === 2 &&
        !parseStructuredPlan(draft.content)
      ) {
        throw new Error('INVALID_PLAN_STRUCTURE');
      }
      const effectiveFrom = new Date(`${input.effectiveFrom}T00:00:00.000Z`);
      const affected = await tx.dietPlanVersion.findFirst({
        where: {
          userId: input.userId,
          effectiveFrom: { lte: effectiveFrom },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
        },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (!affected) throw new Error('PLAN_CORRECTION_TARGET_NOT_FOUND');
      if (affected.effectiveFrom.getTime() === effectiveFrom.getTime()) {
        throw new Error('PLAN_CORRECTION_BOUNDARY_CONFLICT');
      }
      const previousDay = new Date(effectiveFrom);
      previousDay.setUTCDate(previousDay.getUTCDate() - 1);
      const replacement = await tx.dietPlanVersion.create({
        data: {
          userId: input.userId,
          status: affected.status,
          effectiveFrom,
          effectiveTo: affected.effectiveTo,
          sourceType: draft.sourceType,
          snapshot: draft.content === null ? Prisma.JsonNull : draft.content,
          correctionReason: input.reason.trim(),
        },
      });
      await tx.dietPlanVersion.update({
        where: { id: affected.id },
        data: { effectiveTo: previousDay, status: PlanVersionStatus.HISTORICAL },
      });
      await tx.meal.updateMany({
        where: {
          userId: input.userId,
          planVersionId: affected.id,
          localDate: {
            gte: effectiveFrom,
            ...(affected.effectiveTo ? { lte: affected.effectiveTo } : {}),
          },
        },
        data: { planVersionId: replacement.id, revision: { increment: 1 } },
      });
      await tx.dayState.updateMany({
        where: {
          userId: input.userId,
          localDate: {
            gte: effectiveFrom,
            ...(affected.effectiveTo ? { lte: affected.effectiveTo } : {}),
          },
        },
        data: { revision: { increment: 1 } },
      });
      await tx.planDraft.update({
        where: { id: draft.id },
        data: { state: PlanDraftState.ACTIVATED, revision: { increment: 1 } },
      });
      return replacement;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function getPlanOverview(userId: string) {
  const [drafts, versions] = await Promise.all([
    prisma.planDraft.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.dietPlanVersion.findMany({
      where: { userId },
      orderBy: { effectiveFrom: 'desc' },
    }),
  ]);
  return { drafts, versions };
}

export async function getApplicablePlan(input: { userId: string; localDate: string }) {
  const date = new Date(`${input.localDate}T00:00:00.000Z`);
  return prisma.dietPlanVersion.findFirst({
    where: {
      userId: input.userId,
      effectiveFrom: { lte: date },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });
}
