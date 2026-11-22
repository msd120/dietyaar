import 'server-only';
import { MealDraftState, MealType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const snapshotSchema = z.object({
  items: z
    .array(
      z.object({
        displayName: z.string(),
        grams: z.string().nullable(),
        energyKcal: z.string().nullable(),
        proteinG: z.string().nullable(),
        carbohydrateG: z.string().nullable(),
        fatG: z.string().nullable(),
        fiberG: z.string().nullable(),
        sourceType: z.string(),
        sourceId: z.string().nullable().optional(),
        sourceVersion: z.string().nullable().optional(),
        snapshotBasis: z.string(),
      }),
    )
    .min(1),
});

export async function saveMealSnapshot(input: { userId: string; mealId: string; name: string }) {
  const meal = await prisma.meal.findFirst({
    where: { id: input.mealId, userId: input.userId },
    include: { items: true },
  });
  if (!meal) throw new Error('MEAL_NOT_FOUND');
  return prisma.savedMeal.create({
    data: {
      userId: input.userId,
      name: input.name.trim(),
      snapshot: {
        items: meal.items.map((i) => ({
          displayName: i.displayName,
          grams: i.grams?.toString() ?? null,
          energyKcal: i.energyKcal?.toString() ?? null,
          proteinG: i.proteinG?.toString() ?? null,
          carbohydrateG: i.carbohydrateG?.toString() ?? null,
          fatG: i.fatG?.toString() ?? null,
          fiberG: i.fiberG?.toString() ?? null,
          sourceType: i.sourceType,
          sourceId: i.sourceId,
          sourceVersion: i.sourceVersion,
          snapshotBasis: i.snapshotBasis,
        })),
      },
    },
  });
}
export async function listSavedMeals(userId: string) {
  return prisma.savedMeal.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}

export async function renameSavedMeal(input: {
  userId: string;
  savedMealId: string;
  name: string;
}) {
  const updated = await prisma.savedMeal.updateMany({
    where: { id: input.savedMealId, userId: input.userId },
    data: { name: input.name.trim() },
  });
  if (updated.count !== 1) throw new Error('SAVED_MEAL_NOT_FOUND');
}

export async function deleteSavedMeal(input: { userId: string; savedMealId: string }) {
  const deleted = await prisma.savedMeal.deleteMany({
    where: { id: input.savedMealId, userId: input.userId },
  });
  if (deleted.count !== 1) throw new Error('SAVED_MEAL_NOT_FOUND');
}
export async function createDraftFromSavedMeal(input: { userId: string; savedMealId: string }) {
  const saved = await prisma.savedMeal.findFirst({
    where: { id: input.savedMealId, userId: input.userId },
  });
  if (!saved) throw new Error('SAVED_MEAL_NOT_FOUND');
  const [snapshot, profile] = [
    snapshotSchema.parse(saved.snapshot),
    await prisma.profile.findUnique({
      where: { userId: input.userId },
      select: { timezone: true },
    }),
  ];
  const timezone = profile?.timezone ?? 'Asia/Tehran';
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  return prisma.mealDraft.create({
    data: {
      userId: input.userId,
      state: MealDraftState.READY_FOR_REVIEW,
      consumedAtUtc: now,
      localDate: new Date(`${date}T00:00:00.000Z`),
      timezoneAtEntry: timezone,
      mealType: MealType.UNPLANNED,
      items: { create: snapshot.items },
    },
  });
}
