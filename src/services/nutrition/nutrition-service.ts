import 'server-only';
import { CatalogReleaseState } from '@prisma/client';
import { scaleNutrition, type Nutrition } from '@/domain/nutrition/nutrition';
import { env } from '@/lib/env';
import { normalizeInput } from '@/lib/persian';
import { prisma } from '@/lib/prisma';
import type { NutritionSource, ResolvedNutrition } from '@/services/nutrition/nutrition-source';

export function normalizeFoodName(value: string) {
  return normalizeInput(value).trim().replace(/\s+/g, ' ').toLocaleLowerCase('fa-IR');
}

function optionalNutrient(value: number | undefined) {
  if (value === undefined) return null;
  if (!Number.isFinite(value) || value < 0 || value > 100_000) throw new Error('INVALID_NUTRIENT');
  return value;
}

function catalogReleaseFilter() {
  return env.NODE_ENV === 'production' ? CatalogReleaseState.APPROVED : undefined;
}

export async function searchCatalogFoods(query: string, take = 20) {
  const normalized = normalizeFoodName(query);
  if (!normalized) return [];
  return prisma.catalogFood.findMany({
    where: {
      version: { releaseState: catalogReleaseFilter() },
      OR: [
        { normalizedNameFa: { contains: normalized } },
        { normalizedNameEn: { contains: normalized, mode: 'insensitive' } },
      ],
    },
    include: { version: true, servings: true },
    orderBy: { canonicalNameFa: 'asc' },
    take: Math.min(Math.max(take, 1), 20),
  });
}

export async function listCatalogFoods(take = 20) {
  return prisma.catalogFood.findMany({
    where: { version: { releaseState: catalogReleaseFilter() } },
    include: { version: true, servings: true },
    orderBy: { canonicalNameFa: 'asc' },
    take: Math.min(Math.max(take, 1), 20),
  });
}

export async function createUserFood(input: {
  userId: string;
  name: string;
  basisAmount: number;
  basisUnit: 'g';
  energyKcal?: number;
  proteinG?: number;
  carbohydrateG?: number;
  fatG?: number;
  fiberG?: number;
  sourceNote?: string;
}) {
  if (
    !Number.isFinite(input.basisAmount) ||
    input.basisAmount <= 0 ||
    input.basisAmount > 100_000
  ) {
    throw new Error('INVALID_BASIS');
  }
  const name = normalizeInput(input.name).trim();
  if (!name || name.length > 120) throw new Error('INVALID_FOOD_NAME');
  return prisma.userFood.create({
    data: {
      userId: input.userId,
      name,
      normalizedName: normalizeFoodName(name),
      basisAmount: input.basisAmount,
      basisUnit: input.basisUnit,
      energyKcal: optionalNutrient(input.energyKcal),
      proteinG: optionalNutrient(input.proteinG),
      carbohydrateG: optionalNutrient(input.carbohydrateG),
      fatG: optionalNutrient(input.fatG),
      fiberG: optionalNutrient(input.fiberG),
      sourceNote: input.sourceNote?.trim() || null,
    },
  });
}

export async function updateUserFood(input: {
  userId: string;
  foodId: string;
  expectedRevision: number;
  name: string;
  basisAmount: number;
  energyKcal?: number;
  proteinG?: number;
  carbohydrateG?: number;
  fatG?: number;
  fiberG?: number;
  sourceNote?: string;
}) {
  const name = normalizeInput(input.name).trim();
  const updated = await prisma.userFood.updateMany({
    where: { id: input.foodId, userId: input.userId, revision: input.expectedRevision },
    data: {
      name,
      normalizedName: normalizeFoodName(name),
      basisAmount: input.basisAmount,
      energyKcal: optionalNutrient(input.energyKcal),
      proteinG: optionalNutrient(input.proteinG),
      carbohydrateG: optionalNutrient(input.carbohydrateG),
      fatG: optionalNutrient(input.fatG),
      fiberG: optionalNutrient(input.fiberG),
      sourceNote: input.sourceNote?.trim() || null,
      revision: { increment: 1 },
    },
  });
  if (updated.count !== 1) throw new Error('CONFLICT_OR_NOT_FOUND');
}

export async function deleteUserFood(input: { userId: string; foodId: string }) {
  const deleted = await prisma.userFood.deleteMany({
    where: { id: input.foodId, userId: input.userId },
  });
  if (deleted.count !== 1) throw new Error('USER_FOOD_NOT_FOUND');
}

export async function listUserFoods(userId: string, take = 20) {
  return prisma.userFood.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: Math.min(Math.max(take, 1), 20),
  });
}

function nutritionOf(record: {
  energyKcal: { toNumber(): number } | null;
  proteinG: { toNumber(): number } | null;
  carbohydrateG: { toNumber(): number } | null;
  fatG: { toNumber(): number } | null;
  fiberG: { toNumber(): number } | null;
}): Nutrition {
  return {
    energyKcal: record.energyKcal?.toNumber() ?? null,
    proteinG: record.proteinG?.toNumber() ?? null,
    carbohydrateG: record.carbohydrateG?.toNumber() ?? null,
    fatG: record.fatG?.toNumber() ?? null,
    fiberG: record.fiberG?.toNumber() ?? null,
  };
}

export class DatabaseNutritionSource implements NutritionSource {
  async resolveCatalogFood(input: {
    foodId: string;
    grams?: number;
    servingId?: string;
  }): Promise<ResolvedNutrition> {
    const food = await prisma.catalogFood.findFirst({
      where: { id: input.foodId, version: { releaseState: catalogReleaseFilter() } },
      include: { version: true, servings: true },
    });
    if (!food) throw new Error('CATALOG_FOOD_NOT_FOUND');
    const serving = input.servingId
      ? food.servings.find((candidate) => candidate.id === input.servingId)
      : null;
    const grams = input.grams ?? serving?.grams.toNumber() ?? null;
    if (grams === null) throw new Error('UNRESOLVED_PORTION');
    const nutrients = scaleNutrition(nutritionOf(food), grams, food.basisGrams.toNumber());
    return {
      displayName: food.canonicalNameFa,
      grams,
      nutrients,
      sourceType: 'CATALOG',
      sourceId: food.id,
      sourceVersion: food.version.version,
      snapshotBasis: `${food.basisGrams.toString()}g; ${food.sourceCitation}`,
    };
  }

  async resolveUserFood(input: {
    userId: string;
    foodId: string;
    amount: number;
  }): Promise<ResolvedNutrition> {
    const food = await prisma.userFood.findFirst({
      where: { id: input.foodId, userId: input.userId },
    });
    if (!food) throw new Error('USER_FOOD_NOT_FOUND');
    const nutrients = scaleNutrition(nutritionOf(food), input.amount, food.basisAmount.toNumber());
    return {
      displayName: food.name,
      grams: input.amount,
      nutrients,
      sourceType: 'USER_FOOD',
      sourceId: food.id,
      sourceVersion: String(food.revision),
      snapshotBasis: `${food.basisAmount.toString()}${food.basisUnit}; user-entered`,
    };
  }
}
