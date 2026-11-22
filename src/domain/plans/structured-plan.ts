import { z } from 'zod';

const targetRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('MIN'), minimum: z.number().nonnegative() }),
  z.object({ type: z.literal('MAX'), maximum: z.number().nonnegative() }),
  z
    .object({
      type: z.literal('RANGE'),
      minimum: z.number().nonnegative(),
      maximum: z.number().nonnegative(),
    })
    .refine((value) => value.maximum >= value.minimum),
  z.object({ type: z.literal('EXACT'), exact: z.number().nonnegative() }),
]);

export const structuredPlanSchema = z
  .object({
    schemaVersion: z.literal(2),
    title: z.string().max(120),
    sourceNote: z.string().max(1000).optional(),
    mealGuidance: z.string().max(5000).optional(),
    slots: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]{1,40}$/),
          label: z.string().min(1).max(80),
          mealType: z.enum([
            'BREAKFAST',
            'MORNING_SNACK',
            'LUNCH',
            'AFTERNOON_SNACK',
            'DINNER',
            'UNPLANNED',
          ]),
        }),
      )
      .max(12),
    targets: z
      .object({
        energyKcal: targetRuleSchema.optional(),
        proteinG: targetRuleSchema.optional(),
        carbohydrateG: targetRuleSchema.optional(),
        fatG: targetRuleSchema.optional(),
        fiberG: targetRuleSchema.optional(),
      })
      .default({}),
  })
  .superRefine((value, context) => {
    const ids = value.slots.map((slot) => slot.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', path: ['slots'], message: 'Slot IDs must be unique.' });
    }
  });

export type StructuredPlan = z.infer<typeof structuredPlanSchema>;

export function parseStructuredPlan(snapshot: unknown): StructuredPlan | null {
  const parsed = structuredPlanSchema.safeParse(snapshot);
  return parsed.success ? parsed.data : null;
}
