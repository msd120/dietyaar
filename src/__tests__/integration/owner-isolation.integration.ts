import { randomUUID } from 'node:crypto';
import { JobType, PlanSourceType, PlanVersionStatus, PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import { getOwnedJob } from '@/services/jobs/job-service';
import { deleteSavedMeal, renameSavedMeal } from '@/services/meals/saved-meal-service';
import { createUserFood, deleteUserFood } from '@/services/nutrition/nutrition-service';
import { clonePlanVersionToDraft, updateManualPlanDraft } from '@/services/plans/plan-service';
import { deleteWeightEntry, updateWeightEntry } from '@/services/weights/weight-service';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('cross-account isolation matrix', () => {
  it('rejects substituted IDs across plan, saved meal, weight, food, and job services', async () => {
    const ownerId = randomUUID();
    const attackerId = randomUUID();
    for (const id of [ownerId, attackerId]) {
      await prisma.user.create({
        data: { id, name: 'Isolation user', email: `${id}@user.invalid` },
      });
    }
    try {
      const draft = await prisma.planDraft.create({ data: { userId: ownerId, title: 'Private' } });
      const version = await prisma.dietPlanVersion.create({
        data: {
          userId: ownerId,
          status: PlanVersionStatus.ACTIVE,
          effectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
          sourceType: PlanSourceType.MANUAL,
          snapshot: { title: 'Private version' },
        },
      });
      await expect(
        updateManualPlanDraft({
          userId: attackerId,
          draftId: draft.id,
          revision: draft.revision,
          content: {},
          medicalBoundary: false,
        }),
      ).rejects.toThrow('STALE_OR_UNOWNED_DRAFT');
      await expect(
        clonePlanVersionToDraft({ userId: attackerId, versionId: version.id }),
      ).rejects.toThrow('PLAN_VERSION_NOT_FOUND');

      const saved = await prisma.savedMeal.create({
        data: { userId: ownerId, name: 'Private saved meal', snapshot: { items: [] } },
      });
      await expect(
        renameSavedMeal({ userId: attackerId, savedMealId: saved.id, name: 'Attack' }),
      ).rejects.toThrow('SAVED_MEAL_NOT_FOUND');
      await expect(deleteSavedMeal({ userId: attackerId, savedMealId: saved.id })).rejects.toThrow(
        'SAVED_MEAL_NOT_FOUND',
      );

      const weight = await prisma.weightEntry.create({
        data: { userId: ownerId, measuredOn: new Date('2026-11-22'), weightKg: 70 },
      });
      await expect(
        updateWeightEntry({
          userId: attackerId,
          entryId: weight.id,
          measuredOn: '2026-11-22',
          weightKg: 80,
        }),
      ).rejects.toThrow('WEIGHT_ENTRY_NOT_FOUND');
      await expect(deleteWeightEntry({ userId: attackerId, entryId: weight.id })).rejects.toThrow(
        'WEIGHT_ENTRY_NOT_FOUND',
      );

      const food = await createUserFood({
        userId: ownerId,
        name: 'Private food',
        basisAmount: 100,
        basisUnit: 'g',
      });
      await expect(deleteUserFood({ userId: attackerId, foodId: food.id })).rejects.toThrow(
        'USER_FOOD_NOT_FOUND',
      );

      const job = await prisma.job.create({
        data: {
          userId: ownerId,
          type: JobType.SUMMARY_REBUILD,
          payloadJson: {},
          idempotencyKey: `isolation:${ownerId}`,
        },
      });
      await expect(getOwnedJob(attackerId, job.id)).resolves.toBeNull();
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [ownerId, attackerId] } } });
    }
  });
});
