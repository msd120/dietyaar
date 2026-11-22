import 'server-only';
import { MealStatus, SlotExplicitState } from '@prisma/client';
import { deriveSlotState, evaluateTarget } from '@/domain/days/alignment';
import { aggregateNutrition, nutrientKeys, type Nutrition } from '@/domain/nutrition/nutrition';
import { parseStructuredPlan } from '@/domain/plans/structured-plan';
import { prisma } from '@/lib/prisma';
import { finalizeExpiredMealDeletions } from '@/services/meals/meal-service';

function localDateFor(timezone: string, now = new Date()) {
  const value = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  return value;
}

export async function getDaySummary(input: { userId: string; localDate: string }) {
  await finalizeExpiredMealDeletions(input.userId);
  const localDate = new Date(`${input.localDate}T00:00:00.000Z`);
  const [meals, dayState, planVersion, occurrences] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: input.userId, localDate, status: MealStatus.CONFIRMED },
      include: { items: true },
      orderBy: { consumedAtUtc: 'asc' },
    }),
    prisma.dayState.findUnique({
      where: { userId_localDate: { userId: input.userId, localDate } },
    }),
    prisma.dietPlanVersion.findFirst({
      where: {
        userId: input.userId,
        effectiveFrom: { lte: localDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: localDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    }),
    prisma.planSlotOccurrence.findMany({ where: { userId: input.userId, localDate } }),
  ]);
  const items: Nutrition[] = meals.flatMap((meal) =>
    meal.items.map((item) => ({
      energyKcal: item.energyKcal?.toNumber() ?? null,
      proteinG: item.proteinG?.toNumber() ?? null,
      carbohydrateG: item.carbohydrateG?.toNumber() ?? null,
      fatG: item.fatG?.toNumber() ?? null,
      fiberG: item.fiberG?.toNumber() ?? null,
    })),
  );
  const nutrition = aggregateNutrition(items);
  const plan = parseStructuredPlan(planVersion?.snapshot);
  const completed = Boolean(dayState?.completedAt);
  const alignment = Object.fromEntries(
    nutrientKeys.flatMap((key) => {
      const rule = plan?.targets[key];
      return rule
        ? [
            [
              key,
              {
                rule,
                ...evaluateTarget({ nutrient: nutrition[key], rule, dayComplete: completed }),
              },
            ],
          ]
        : [];
    }),
  );
  const slots =
    plan?.slots.map((slot) => {
      const occurrence = occurrences.find(
        (candidate) => candidate.planVersionId === planVersion?.id && candidate.slotId === slot.id,
      );
      const linkedMealCount = meals.filter(
        (meal) => meal.planVersionId === planVersion?.id && meal.slotId === slot.id,
      ).length;
      return {
        ...slot,
        state: deriveSlotState({
          linkedMealCount,
          explicitlySkipped: occurrence?.explicitState === SlotExplicitState.SKIPPED,
        }),
        revision: occurrence?.revision ?? 0,
      };
    }) ?? [];
  return {
    localDate: input.localDate,
    meals,
    nutrition,
    completed,
    sourceRevision: dayState?.revision ?? 0,
    planVersion,
    plan,
    alignment,
    slots,
  };
}

export async function getTodayDaySummary(input: { userId: string; timezone: string }) {
  return getDaySummary({ userId: input.userId, localDate: localDateFor(input.timezone) });
}

export async function getSevenDaySummaryRows(input: { userId: string; timezone: string }) {
  await finalizeExpiredMealDeletions(input.userId);
  const endText = localDateFor(input.timezone);
  const end = new Date(`${endText}T00:00:00.000Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const [meals, dayStates, plans] = await Promise.all([
    prisma.meal.findMany({
      where: {
        userId: input.userId,
        status: MealStatus.CONFIRMED,
        localDate: { gte: start, lte: end },
      },
      include: { items: true },
      orderBy: { consumedAtUtc: 'desc' },
    }),
    prisma.dayState.findMany({
      where: { userId: input.userId, localDate: { gte: start, lte: end } },
    }),
    prisma.dietPlanVersion.findMany({
      where: {
        userId: input.userId,
        effectiveFrom: { lte: end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    }),
  ]);
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - offset);
    const dateText = date.toISOString().slice(0, 10);
    const dateMeals = meals.filter((meal) => meal.localDate.getTime() === date.getTime());
    const state = dayStates.find((candidate) => candidate.localDate.getTime() === date.getTime());
    const version = plans.find(
      (candidate) =>
        candidate.effectiveFrom <= date &&
        (!candidate.effectiveTo || candidate.effectiveTo >= date),
    );
    const plan = parseStructuredPlan(version?.snapshot);
    const nutrition = aggregateNutrition(
      dateMeals.flatMap((meal) =>
        meal.items.map((item) => ({
          energyKcal: item.energyKcal?.toNumber() ?? null,
          proteinG: item.proteinG?.toNumber() ?? null,
          carbohydrateG: item.carbohydrateG?.toNumber() ?? null,
          fatG: item.fatG?.toNumber() ?? null,
          fiberG: item.fiberG?.toNumber() ?? null,
        })),
      ),
    );
    const completed = Boolean(state?.completedAt);
    const energyRule = plan?.targets.energyKcal;
    return {
      localDate: dateText,
      mealCount: dateMeals.length,
      completed,
      nutrition,
      hasPlan: Boolean(version),
      energyAlignment: energyRule
        ? evaluateTarget({
            nutrient: nutrition.energyKcal,
            rule: energyRule,
            dayComplete: completed,
          })
        : null,
    };
  });
}
