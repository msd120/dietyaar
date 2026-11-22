import { describe, expect, it } from 'vitest';
import { deriveSlotState, evaluateTarget } from '@/domain/days/alignment';
import { aggregateNutrition, scaleNutrition } from '@/domain/nutrition/nutrition';
import { structuredPlanSchema } from '@/domain/plans/structured-plan';

describe('deterministic nutrition and alignment', () => {
  it('scales only known values through an explicit gram basis', () => {
    expect(
      scaleNutrition(
        {
          energyKcal: 200,
          proteinG: 10,
          carbohydrateG: null,
          fatG: 4,
          fiberG: null,
        },
        50,
        100,
      ),
    ).toEqual({
      energyKcal: 100,
      proteinG: 5,
      carbohydrateG: null,
      fatG: 2,
      fiberG: null,
    });
  });

  it('keeps known totals and unknown contributors separate', () => {
    const totals = aggregateNutrition([
      { energyKcal: 100, proteinG: 5, carbohydrateG: null, fatG: 2, fiberG: null },
      { energyKcal: null, proteinG: 3, carbohydrateG: 20, fatG: null, fiberG: 4 },
    ]);
    expect(totals.energyKcal).toEqual({ knownTotal: 100, unknownItemCount: 1 });
    expect(totals.proteinG).toEqual({ knownTotal: 8, unknownItemCount: 0 });
  });

  it.each([
    [{ knownTotal: 900, unknownItemCount: 0 }, false, 'PARTIAL', false],
    [{ knownTotal: 1900, unknownItemCount: 0 }, true, 'WITHIN', false],
    [{ knownTotal: 1700, unknownItemCount: 0 }, true, 'BELOW', false],
    [{ knownTotal: 2100, unknownItemCount: 1 }, false, 'ABOVE', true],
    [{ knownTotal: 1900, unknownItemCount: 1 }, true, 'UNKNOWN', false],
  ] as const)(
    'evaluates range without turning partial or unknown data into adherence',
    (nutrient, dayComplete, status, knownAlreadyAbove) => {
      expect(
        evaluateTarget({
          nutrient,
          dayComplete,
          rule: { type: 'RANGE', minimum: 1800, maximum: 2000 },
        }),
      ).toEqual({ status, knownAlreadyAbove });
    },
  );

  it('applies no implicit tolerance to exact targets', () => {
    expect(
      evaluateTarget({
        nutrient: { knownTotal: 99.9, unknownItemCount: 0 },
        dayComplete: true,
        rule: { type: 'EXACT', exact: 100 },
      }).status,
    ).toBe('BELOW');
  });

  it('derives recorded before explicit skipped and never infers missing as skipped', () => {
    expect(deriveSlotState({ linkedMealCount: 1, explicitlySkipped: true })).toBe('RECORDED');
    expect(deriveSlotState({ linkedMealCount: 0, explicitlySkipped: true })).toBe('SKIPPED');
    expect(deriveSlotState({ linkedMealCount: 0, explicitlySkipped: false })).toBe('NOT_RECORDED');
  });

  it('rejects duplicate slot IDs and inverted ranges', () => {
    expect(
      structuredPlanSchema.safeParse({
        schemaVersion: 2,
        title: 'Plan',
        slots: [
          { id: 'lunch', label: 'Lunch', mealType: 'LUNCH' },
          { id: 'lunch', label: 'Duplicate', mealType: 'LUNCH' },
        ],
        targets: { energyKcal: { type: 'RANGE', minimum: 2000, maximum: 1800 } },
      }).success,
    ).toBe(false);
  });
});
