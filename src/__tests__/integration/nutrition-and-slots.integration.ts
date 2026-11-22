import { randomUUID } from 'node:crypto';
import {
  CatalogReleaseState,
  PlanSourceType,
  PlanVersionStatus,
  PrismaClient,
} from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import { getDaySummary } from '@/services/days/day-summary-service';
import { setSlotSkipped } from '@/services/days/slot-service';
import { confirmMealDraft, createManualMealDraft } from '@/services/meals/meal-service';
import {
  createUserFood,
  DatabaseNutritionSource,
  searchCatalogFoods,
} from '@/services/nutrition/nutrition-service';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('nutrition catalog and planned slots', () => {
  it('scales sourced snapshots, isolates user foods, and clears skipped when a meal links', async () => {
    const userId = randomUUID();
    const otherUserId = randomUUID();
    const versionName = `integration-${randomUUID()}`;
    const version = await prisma.catalogVersion.create({
      data: {
        version: versionName,
        sourceDocument: 'integration fixture',
        licenseNote: 'test only',
        releaseState: CatalogReleaseState.DEVELOPMENT_FIXTURE,
      },
    });
    const catalogFood = await prisma.catalogFood.create({
      data: {
        versionId: version.id,
        canonicalNameFa: 'غذای آزمون',
        canonicalNameEn: 'Integration food',
        normalizedNameFa: 'غذای آزمون',
        normalizedNameEn: 'integration food',
        basisGrams: 100,
        energyKcal: 200,
        proteinG: 10,
        confidenceLabel: 'TEST',
        sourceCitation: 'integration fixture',
      },
    });
    for (const id of [userId, otherUserId]) {
      await prisma.user.create({
        data: {
          id,
          name: 'Nutrition user',
          email: `${id}@user.invalid`,
          profile: { create: { timezone: 'Asia/Tehran', age: 30 } },
        },
      });
    }
    try {
      await expect(searchCatalogFoods('Integration')).resolves.toHaveLength(1);
      const userFood = await createUserFood({
        userId,
        name: 'Label food',
        basisAmount: 50,
        basisUnit: 'g',
        energyKcal: 80,
        proteinG: 4,
      });
      const source = new DatabaseNutritionSource();
      await expect(
        source.resolveUserFood({ userId: otherUserId, foodId: userFood.id, amount: 100 }),
      ).rejects.toThrow('USER_FOOD_NOT_FOUND');
      await expect(
        source.resolveUserFood({ userId, foodId: userFood.id, amount: 100 }),
      ).resolves.toMatchObject({ nutrients: { energyKcal: 160, proteinG: 8 } });

      const plan = await prisma.dietPlanVersion.create({
        data: {
          userId,
          status: PlanVersionStatus.ACTIVE,
          effectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
          sourceType: PlanSourceType.MANUAL,
          snapshot: {
            schemaVersion: 2,
            title: 'Structured test plan',
            slots: [{ id: 'lunch', label: 'Lunch', mealType: 'LUNCH' }],
            targets: { energyKcal: { type: 'RANGE', minimum: 90, maximum: 110 } },
          },
        },
      });
      const draft = await createManualMealDraft({
        userId,
        displayName: 'ignored',
        grams: 50,
        linkedSlotId: 'lunch',
        source: { type: 'CATALOG', foodId: catalogFood.id },
      });
      const storedDraft = await prisma.mealDraft.findUniqueOrThrow({ where: { id: draft.id } });
      const localDate = storedDraft.localDate.toISOString().slice(0, 10);
      await setSlotSkipped({
        userId,
        localDate,
        planVersionId: plan.id,
        slotId: 'lunch',
        skipped: true,
      });
      await expect(
        setSlotSkipped({
          userId: otherUserId,
          localDate,
          planVersionId: plan.id,
          slotId: 'lunch',
          skipped: true,
        }),
      ).rejects.toThrow('PLAN_SLOT_NOT_FOUND');
      const meal = await confirmMealDraft({ userId, draftId: draft.id });
      const confirmed = await prisma.meal.findUniqueOrThrow({
        where: { id: meal.id },
        include: { items: true },
      });
      expect(confirmed).toMatchObject({
        slotId: 'lunch',
        items: [
          {
            sourceType: 'CATALOG',
            sourceId: catalogFood.id,
            sourceVersion: versionName,
          },
        ],
      });
      expect(confirmed.items[0]?.energyKcal?.toNumber()).toBe(100);
      const summary = await getDaySummary({ userId, localDate });
      expect(summary.nutrition.energyKcal).toEqual({ knownTotal: 100, unknownItemCount: 0 });
      expect(summary.slots).toMatchObject([{ id: 'lunch', state: 'RECORDED' }]);
      expect(summary.alignment.energyKcal).toMatchObject({ status: 'PARTIAL' });
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
      await prisma.catalogFood.deleteMany({ where: { versionId: version.id } });
      await prisma.catalogVersion.delete({ where: { id: version.id } });
    }
  });
});
