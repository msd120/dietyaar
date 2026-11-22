import { randomUUID } from 'node:crypto';
import {
  ConsentPurpose,
  MediaPurpose,
  PlanSourceType,
  PlanVersionStatus,
  PrismaClient,
  ReflectionFeedbackValue,
} from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import {
  confirmMealDraft,
  createManualMealDraft,
  reviseConfirmedMeal,
} from '@/services/meals/meal-service';
import {
  finalizeMediaUpload,
  getOwnedMediaAccess,
  createMediaUploadIntent,
} from '@/services/media/media-service';
import type { MediaStorage } from '@/services/media/media-storage';
import {
  getOrCreateDeterministicReflection,
  setReflectionFeedback,
} from '@/services/reflections/reflection-service';
import {
  activateHistoricalPlanCorrection,
  clonePlanVersionToDraft,
  updateManualPlanDraft,
} from '@/services/plans/plan-service';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('manual meal journey', () => {
  it('confirms one meal idempotently and links the applicable plan', async () => {
    const userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Integration user',
        email: `${userId}@user.invalid`,
        username: `integration_${userId.replaceAll('-', '').slice(0, 12)}`,
        profile: { create: { timezone: 'Asia/Tehran', age: 30 } },
      },
    });

    try {
      const plan = await prisma.dietPlanVersion.create({
        data: {
          userId,
          status: PlanVersionStatus.ACTIVE,
          effectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
          sourceType: PlanSourceType.MANUAL,
          snapshot: { schemaVersion: 1, title: 'Integration plan' },
        },
      });
      const draft = await createManualMealDraft({
        userId,
        displayName: 'Test meal',
        grams: 150,
        energyKcal: 250,
      });

      const first = await confirmMealDraft({ userId, draftId: draft.id });
      const second = await confirmMealDraft({ userId, draftId: draft.id });

      expect(second.id).toBe(first.id);
      expect(await prisma.meal.count({ where: { sourceDraftId: draft.id } })).toBe(1);
      expect(await prisma.meal.findUniqueOrThrow({ where: { id: first.id } })).toMatchObject({
        planVersionId: plan.id,
      });
    } finally {
      await prisma.meal.deleteMany({ where: { userId } });
      await prisma.mealDraft.deleteMany({ where: { userId } });
      await prisma.dietPlanVersion.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
  });

  it('guards meal revisions and reflection feedback by owner and revision', async () => {
    const userId = randomUUID();
    const otherUserId = randomUUID();
    for (const id of [userId, otherUserId]) {
      await prisma.user.create({
        data: {
          id,
          name: 'Ownership user',
          email: `${id}@user.invalid`,
          username: `owner_${id.replaceAll('-', '').slice(0, 12)}`,
          profile: { create: { timezone: 'Asia/Tehran', age: 30 } },
        },
      });
    }
    try {
      const draft = await createManualMealDraft({ userId, displayName: 'Before', energyKcal: 100 });
      const meal = await confirmMealDraft({ userId, draftId: draft.id });
      await expect(
        reviseConfirmedMeal({
          userId: otherUserId,
          mealId: meal.id,
          expectedRevision: 1,
          displayName: 'Attack',
        }),
      ).rejects.toThrow('MEAL_NOT_FOUND');
      await reviseConfirmedMeal({
        userId,
        mealId: meal.id,
        expectedRevision: 1,
        displayName: 'After',
        energyKcal: 120,
      });
      await expect(
        reviseConfirmedMeal({
          userId,
          mealId: meal.id,
          expectedRevision: 1,
          displayName: 'Stale',
        }),
      ).rejects.toThrow('CONFLICT');
      expect(await prisma.mealRevision.count({ where: { mealId: meal.id } })).toBe(1);

      const reflection = await getOrCreateDeterministicReflection({
        userId,
        localDate: meal.localDate.toISOString().slice(0, 10),
        mealCount: 1,
        unknownEnergyItemCount: 0,
        sourceRevision: 2,
      });
      await expect(
        setReflectionFeedback({
          userId: otherUserId,
          reflectionId: reflection.id,
          value: ReflectionFeedbackValue.HELPFUL,
        }),
      ).rejects.toThrow('REFLECTION_NOT_FOUND');
      await setReflectionFeedback({
        userId,
        reflectionId: reflection.id,
        value: ReflectionFeedbackValue.HELPFUL,
      });
      expect(
        await prisma.reflectionFeedback.count({ where: { reflectionId: reflection.id } }),
      ).toBe(1);
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    }
  });

  it('keeps finalized private media owner-only with an injected storage contract', async () => {
    const userId = randomUUID();
    const otherUserId = randomUUID();
    const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const storage: MediaStorage = {
      async createSignedUpload() {
        return {
          url: 'https://storage.invalid/upload',
          token: 'test-token',
          expiresInSeconds: 120,
        };
      },
      async createSignedDownload() {
        return 'https://storage.invalid/download';
      },
      async download() {
        return { bytes: png, contentType: 'image/png' };
      },
      async remove() {},
    };
    for (const id of [userId, otherUserId]) {
      await prisma.user.create({
        data: {
          id,
          name: 'Media user',
          email: `${id}@user.invalid`,
          username: `media_${id.replaceAll('-', '').slice(0, 12)}`,
          consents: {
            create: {
              purpose: ConsentPurpose.PLAN_IMAGE,
              policyVersion: 'test',
              grantedAt: new Date(),
            },
          },
        },
      });
    }
    try {
      const intent = await createMediaUploadIntent({
        userId,
        purpose: MediaPurpose.PLAN_IMAGE,
        mimeType: 'image/png',
        byteSize: png.length,
        storage,
      });
      await finalizeMediaUpload({ userId, assetId: intent.assetId, storage });
      await expect(
        getOwnedMediaAccess({ userId: otherUserId, assetId: intent.assetId, storage }),
      ).rejects.toThrow('MEDIA_NOT_FOUND');
      await expect(
        getOwnedMediaAccess({ userId, assetId: intent.assetId, storage }),
      ).resolves.toMatchObject({
        url: 'https://storage.invalid/download',
        expiresInSeconds: 60,
      });
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    }
  });

  it('applies an audited historical plan correction only to affected dates', async () => {
    const userId = randomUUID();
    await prisma.user.create({
      data: { id: userId, name: 'Plan user', email: `${userId}@user.invalid` },
    });
    try {
      const original = await prisma.dietPlanVersion.create({
        data: {
          userId,
          status: PlanVersionStatus.ACTIVE,
          effectiveFrom: new Date('2026-11-01T00:00:00.000Z'),
          sourceType: PlanSourceType.MANUAL,
          snapshot: { title: 'Original' },
        },
      });
      const before = await prisma.meal.create({
        data: {
          userId,
          planVersionId: original.id,
          consumedAtUtc: new Date('2026-11-05T08:00:00.000Z'),
          localDate: new Date('2026-11-05T00:00:00.000Z'),
          timezoneAtEntry: 'Asia/Tehran',
          mealType: 'UNPLANNED',
        },
      });
      const affected = await prisma.meal.create({
        data: {
          userId,
          planVersionId: original.id,
          consumedAtUtc: new Date('2026-11-12T08:00:00.000Z'),
          localDate: new Date('2026-11-12T00:00:00.000Z'),
          timezoneAtEntry: 'Asia/Tehran',
          mealType: 'UNPLANNED',
        },
      });
      const cloned = await clonePlanVersionToDraft({ userId, versionId: original.id });
      const reviewed = await updateManualPlanDraft({
        userId,
        draftId: cloned.id,
        revision: cloned.revision,
        title: 'Corrected',
        content: { title: 'Corrected' },
        medicalBoundary: false,
      });
      const correction = await activateHistoricalPlanCorrection({
        userId,
        draftId: reviewed.id,
        revision: reviewed.revision,
        effectiveFrom: '2026-11-10',
        reason: 'Source document correction',
      });
      expect(correction).toMatchObject({ correctionReason: 'Source document correction' });
      expect(await prisma.meal.findUniqueOrThrow({ where: { id: before.id } })).toMatchObject({
        planVersionId: original.id,
      });
      expect(await prisma.meal.findUniqueOrThrow({ where: { id: affected.id } })).toMatchObject({
        planVersionId: correction.id,
        revision: 2,
      });
      expect(
        await prisma.dietPlanVersion.findUniqueOrThrow({ where: { id: original.id } }),
      ).toMatchObject({
        effectiveTo: new Date('2026-11-09T00:00:00.000Z'),
      });
    } finally {
      await prisma.user.delete({ where: { id: userId } });
    }
  });
});
