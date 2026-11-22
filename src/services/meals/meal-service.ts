import 'server-only';
import { MealDraftState, MealStatus, MealType, Prisma } from '@prisma/client';
import { parseStructuredPlan } from '@/domain/plans/structured-plan';
import { prisma } from '@/lib/prisma';
import { DatabaseNutritionSource } from '@/services/nutrition/nutrition-service';

type ManualMealInput = {
  userId: string;
  displayName: string;
  grams?: number;
  energyKcal?: number;
  proteinG?: number;
  carbohydrateG?: number;
  fatG?: number;
  fiberG?: number;
  linkedSlotId?: string;
  source?:
    { type: 'CATALOG'; foodId: string; servingId?: string } | { type: 'USER_FOOD'; foodId: string };
};

function localDateFor(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value;
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
}

export async function createManualMealDraft(input: ManualMealInput) {
  const now = new Date();
  const profile = await prisma.profile.findUnique({
    where: { userId: input.userId },
    select: { timezone: true },
  });
  const timezone = profile?.timezone ?? 'Asia/Tehran';
  const localDate = localDateFor(timezone, now);
  const applicablePlan = input.linkedSlotId
    ? await prisma.dietPlanVersion.findFirst({
        where: {
          userId: input.userId,
          effectiveFrom: { lte: localDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: localDate } }],
        },
        orderBy: { effectiveFrom: 'desc' },
      })
    : null;
  const structuredPlan = parseStructuredPlan(applicablePlan?.snapshot);
  const linkedSlot = input.linkedSlotId
    ? structuredPlan?.slots.find((slot) => slot.id === input.linkedSlotId)
    : null;
  if (input.linkedSlotId && !linkedSlot) throw new Error('PLAN_SLOT_NOT_FOUND');

  const nutritionSource = new DatabaseNutritionSource();
  const resolved = input.source
    ? input.source.type === 'CATALOG'
      ? await nutritionSource.resolveCatalogFood({
          foodId: input.source.foodId,
          grams: input.grams,
          servingId: input.source.servingId,
        })
      : await nutritionSource.resolveUserFood({
          userId: input.userId,
          foodId: input.source.foodId,
          amount: input.grams ?? 0,
        })
    : null;
  return prisma.mealDraft.create({
    data: {
      userId: input.userId,
      state: MealDraftState.READY_FOR_REVIEW,
      consumedAtUtc: now,
      localDate,
      timezoneAtEntry: timezone,
      mealType: linkedSlot ? MealType[linkedSlot.mealType] : MealType.UNPLANNED,
      linkedSlotId: linkedSlot?.id,
      items: {
        create: {
          displayName: resolved?.displayName ?? input.displayName,
          grams: resolved?.grams ?? input.grams,
          energyKcal: resolved?.nutrients.energyKcal ?? input.energyKcal,
          proteinG: resolved?.nutrients.proteinG ?? input.proteinG,
          carbohydrateG: resolved?.nutrients.carbohydrateG ?? input.carbohydrateG,
          fatG: resolved?.nutrients.fatG ?? input.fatG,
          fiberG: resolved?.nutrients.fiberG ?? input.fiberG,
          sourceType: resolved?.sourceType ?? 'MANUAL',
          sourceId: resolved?.sourceId,
          sourceVersion: resolved?.sourceVersion,
          snapshotBasis: resolved?.snapshotBasis ?? 'user-entered',
        },
      },
    },
    select: { id: true, revision: true },
  });
}

export async function confirmMealDraft(input: { userId: string; draftId: string }) {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.mealDraft.findFirst({
      where: { id: input.draftId, userId: input.userId },
      include: { items: true },
    });
    if (!draft) throw new Error('MEAL_DRAFT_NOT_FOUND');
    if (draft.state === MealDraftState.CONFIRMED) {
      const existing = await tx.meal.findUnique({ where: { sourceDraftId: draft.id } });
      if (existing) return existing;
    }

    const claim = await tx.mealDraft.updateMany({
      where: { id: draft.id, userId: input.userId, state: MealDraftState.READY_FOR_REVIEW },
      data: { state: MealDraftState.CONFIRMED, revision: { increment: 1 } },
    });
    if (claim.count !== 1) throw new Error('MEAL_DRAFT_ALREADY_CONFIRMED');

    const applicablePlan = await tx.dietPlanVersion.findFirst({
      where: {
        userId: input.userId,
        effectiveFrom: { lte: draft.localDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: draft.localDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      select: { id: true, snapshot: true },
    });
    const structuredPlan = parseStructuredPlan(applicablePlan?.snapshot);
    const linkedSlot = draft.linkedSlotId
      ? structuredPlan?.slots.find((slot) => slot.id === draft.linkedSlotId)
      : null;
    if (draft.linkedSlotId && !linkedSlot) throw new Error('PLAN_SLOT_NOT_FOUND');

    const meal = await tx.meal.create({
      data: {
        userId: input.userId,
        sourceDraftId: draft.id,
        planVersionId: applicablePlan?.id,
        status: MealStatus.CONFIRMED,
        consumedAtUtc: draft.consumedAtUtc,
        localDate: draft.localDate,
        timezoneAtEntry: draft.timezoneAtEntry,
        mealType: draft.mealType,
        slotId: linkedSlot?.id,
        items: {
          create: draft.items.map((item) => ({
            displayName: item.displayName,
            grams: item.grams,
            energyKcal: item.energyKcal,
            proteinG: item.proteinG,
            carbohydrateG: item.carbohydrateG,
            fatG: item.fatG,
            fiberG: item.fiberG,
            sourceType: item.sourceType,
            sourceId: item.sourceId,
            sourceVersion: item.sourceVersion,
            snapshotBasis: item.snapshotBasis,
          })),
        },
      },
      select: { id: true, localDate: true },
    });

    await tx.dayState.upsert({
      where: { userId_localDate: { userId: input.userId, localDate: meal.localDate } },
      create: { userId: input.userId, localDate: meal.localDate, reopenedAt: new Date() },
      update: { completedAt: null, reopenedAt: new Date(), revision: { increment: 1 } },
    });
    if (linkedSlot && applicablePlan) {
      await tx.planSlotOccurrence.upsert({
        where: {
          userId_localDate_planVersionId_slotId: {
            userId: input.userId,
            localDate: meal.localDate,
            planVersionId: applicablePlan.id,
            slotId: linkedSlot.id,
          },
        },
        create: {
          userId: input.userId,
          localDate: meal.localDate,
          planVersionId: applicablePlan.id,
          slotId: linkedSlot.id,
          explicitState: null,
        },
        update: { explicitState: null, revision: { increment: 1 } },
      });
    }

    return meal;
  });
}

export async function listConfirmedMealsForToday(input: { userId: string; timezone: string }) {
  await finalizeExpiredMealDeletions(input.userId);
  const localDate = localDateFor(input.timezone);
  return prisma.meal.findMany({
    where: { userId: input.userId, localDate, status: MealStatus.CONFIRMED },
    include: { items: true },
    orderBy: { consumedAtUtc: 'asc' },
  });
}

export async function getTodayMealSummary(input: { userId: string; timezone: string }) {
  await finalizeExpiredMealDeletions(input.userId);
  const localDate = localDateFor(input.timezone);
  const [meals, dayState] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: input.userId, localDate, status: MealStatus.CONFIRMED },
      include: { items: true },
      orderBy: { consumedAtUtc: 'asc' },
    }),
    prisma.dayState.findUnique({
      where: { userId_localDate: { userId: input.userId, localDate } },
      select: { revision: true, completedAt: true },
    }),
  ]);
  const items = meals.flatMap((meal) => meal.items);
  const knownEnergyKcal = items.reduce((sum, item) => sum + (item.energyKcal?.toNumber() ?? 0), 0);
  return {
    localDate: localDate.toISOString().slice(0, 10),
    meals,
    knownEnergyKcal,
    unknownEnergyItemCount: items.filter((item) => item.energyKcal === null).length,
    sourceRevision: dayState?.revision ?? 0,
    completed: Boolean(dayState?.completedAt),
  };
}

export async function listMealHistory(input: { userId: string; timezone: string; days?: number }) {
  await finalizeExpiredMealDeletions(input.userId);
  const end = localDateFor(input.timezone);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - ((input.days ?? 7) - 1));
  return prisma.meal.findMany({
    where: {
      userId: input.userId,
      status: MealStatus.CONFIRMED,
      localDate: { gte: start, lte: end },
    },
    include: { items: true },
    orderBy: [{ localDate: 'desc' }, { consumedAtUtc: 'desc' }],
  });
}

export async function requestMealDeletion(input: { userId: string; mealId: string; now?: Date }) {
  const now = input.now ?? new Date();
  const updated = await prisma.meal.updateMany({
    where: { id: input.mealId, userId: input.userId, status: MealStatus.CONFIRMED },
    data: { pendingDeletionUntil: new Date(now.getTime() + 10_000), revision: { increment: 1 } },
  });
  if (updated.count !== 1) throw new Error('MEAL_NOT_FOUND');
}

export async function reviseConfirmedMeal(input: {
  userId: string;
  mealId: string;
  expectedRevision: number;
  displayName: string;
  grams?: number;
  energyKcal?: number;
}) {
  return prisma.$transaction(async (tx) => {
    const meal = await tx.meal.findFirst({
      where: { id: input.mealId, userId: input.userId, status: MealStatus.CONFIRMED },
      include: { items: true },
    });
    if (!meal) throw new Error('MEAL_NOT_FOUND');
    if (meal.revision !== input.expectedRevision) throw new Error('CONFLICT');
    const snapshot = {
      mealType: meal.mealType,
      consumedAtUtc: meal.consumedAtUtc.toISOString(),
      items: meal.items.map((item) => ({
        displayName: item.displayName,
        grams: item.grams?.toString() ?? null,
        energyKcal: item.energyKcal?.toString() ?? null,
        proteinG: item.proteinG?.toString() ?? null,
        carbohydrateG: item.carbohydrateG?.toString() ?? null,
        fatG: item.fatG?.toString() ?? null,
        fiberG: item.fiberG?.toString() ?? null,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        sourceVersion: item.sourceVersion,
        snapshotBasis: item.snapshotBasis,
      })),
    } satisfies Prisma.InputJsonObject;
    await tx.mealRevision.create({
      data: {
        userId: input.userId,
        mealId: meal.id,
        revision: meal.revision,
        snapshot,
      },
    });
    const claimed = await tx.meal.updateMany({
      where: { id: meal.id, userId: input.userId, revision: input.expectedRevision },
      data: { revision: { increment: 1 }, pendingDeletionUntil: null },
    });
    if (claimed.count !== 1) throw new Error('CONFLICT');
    await tx.mealItem.deleteMany({ where: { mealId: meal.id } });
    await tx.mealItem.create({
      data: {
        mealId: meal.id,
        displayName: input.displayName.trim(),
        grams: input.grams,
        energyKcal: input.energyKcal,
        sourceType: 'MANUAL_REVISION',
        snapshotBasis: 'user-entered',
      },
    });
    await tx.dayState.upsert({
      where: { userId_localDate: { userId: input.userId, localDate: meal.localDate } },
      create: { userId: input.userId, localDate: meal.localDate, reopenedAt: new Date() },
      update: { completedAt: null, reopenedAt: new Date(), revision: { increment: 1 } },
    });
    return { revision: meal.revision + 1 };
  });
}

export async function undoMealDeletion(input: { userId: string; mealId: string; now?: Date }) {
  const now = input.now ?? new Date();
  const updated = await prisma.meal.updateMany({
    where: {
      id: input.mealId,
      userId: input.userId,
      status: MealStatus.CONFIRMED,
      pendingDeletionUntil: { gt: now },
    },
    data: { pendingDeletionUntil: null, revision: { increment: 1 } },
  });
  if (updated.count !== 1) throw new Error('UNDO_WINDOW_EXPIRED');
}

export async function finalizeExpiredMealDeletions(userId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const expired = await tx.meal.findMany({
      where: { userId, status: MealStatus.CONFIRMED, pendingDeletionUntil: { lte: now } },
      select: { id: true, localDate: true },
    });
    if (expired.length === 0) return { count: 0 };
    const updated = await tx.meal.updateMany({
      where: { id: { in: expired.map((meal) => meal.id) }, userId },
      data: {
        status: MealStatus.DELETED,
        deletedAt: now,
        pendingDeletionUntil: null,
        revision: { increment: 1 },
      },
    });
    for (const localDate of new Map(
      expired.map((meal) => [meal.localDate.toISOString(), meal.localDate]),
    ).values()) {
      await tx.dayState.upsert({
        where: { userId_localDate: { userId, localDate } },
        create: { userId, localDate, reopenedAt: now },
        update: { completedAt: null, reopenedAt: now, revision: { increment: 1 } },
      });
    }
    return updated;
  });
}
