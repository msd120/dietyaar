export const nutrientKeys = ['energyKcal', 'proteinG', 'carbohydrateG', 'fatG', 'fiberG'] as const;

export type NutrientKey = (typeof nutrientKeys)[number];
export type Nutrition = Record<NutrientKey, number | null>;

export function scaleNutrient(
  basisValue: number | null,
  consumedGrams: number | null,
  basisGrams: number,
) {
  if (basisValue === null || consumedGrams === null) return null;
  if (!Number.isFinite(basisValue) || basisValue < 0) throw new Error('INVALID_NUTRIENT');
  if (!Number.isFinite(consumedGrams) || consumedGrams <= 0) throw new Error('INVALID_PORTION');
  if (!Number.isFinite(basisGrams) || basisGrams <= 0) throw new Error('INVALID_BASIS');
  return (basisValue * consumedGrams) / basisGrams;
}

export function scaleNutrition(
  basis: Nutrition,
  consumedGrams: number | null,
  basisGrams: number,
): Nutrition {
  return Object.fromEntries(
    nutrientKeys.map((key) => [key, scaleNutrient(basis[key], consumedGrams, basisGrams)]),
  ) as Nutrition;
}

export type AggregatedNutrient = { knownTotal: number; unknownItemCount: number };
export type AggregatedNutrition = Record<NutrientKey, AggregatedNutrient>;

export function aggregateNutrition(items: Nutrition[]): AggregatedNutrition {
  return Object.fromEntries(
    nutrientKeys.map((key) => {
      const values = items.map((item) => item[key]);
      return [
        key,
        {
          knownTotal: values.reduce<number>((sum, value) => sum + (value ?? 0), 0),
          unknownItemCount: values.filter((value) => value === null).length,
        },
      ];
    }),
  ) as AggregatedNutrition;
}
