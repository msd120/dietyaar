import 'server-only';
import type { Nutrition } from '@/domain/nutrition/nutrition';

export type ResolvedNutrition = {
  displayName: string;
  grams: number | null;
  nutrients: Nutrition;
  sourceType: 'CATALOG' | 'USER_FOOD';
  sourceId: string;
  sourceVersion: string;
  snapshotBasis: string;
};

export interface NutritionSource {
  resolveCatalogFood(input: {
    foodId: string;
    grams?: number;
    servingId?: string;
  }): Promise<ResolvedNutrition>;
  resolveUserFood(input: {
    userId: string;
    foodId: string;
    amount: number;
  }): Promise<ResolvedNutrition>;
}
