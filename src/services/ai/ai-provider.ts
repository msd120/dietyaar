import 'server-only';
import { z } from 'zod';

const resultMetadata = {
  schemaVersion: z.literal(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  assumptions: z.array(z.string().max(300)).max(20),
  unresolvedFields: z.array(z.string().max(100)).max(50),
};

export const planExtractionSchema = z.object({
  ...resultMetadata,
  title: z.string().max(120).nullable(),
  mealGuidance: z.string().max(5000).nullable(),
});

export const mealRecognitionSchema = z.object({
  ...resultMetadata,
  candidates: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        portionText: z.string().max(120).nullable(),
        preparation: z.string().max(200).nullable(),
        confidence: z.number().min(0).max(1).nullable(),
      }),
    )
    .max(30),
});

export const reflectionTextSchema = z.object({
  ...resultMetadata,
  locale: z.enum(['fa', 'en']),
  text: z.string().min(1).max(600),
});

export type PlanExtractionDraft = z.infer<typeof planExtractionSchema>;
export type FoodRecognitionDraft = z.infer<typeof mealRecognitionSchema>;
export type ReflectionDraft = z.infer<typeof reflectionTextSchema>;

export interface AiProvider {
  parseDietPlanImage(input: { bytes: Uint8Array; mimeType: string }): Promise<PlanExtractionDraft>;
  recognizeMealPhoto(input: { bytes: Uint8Array; mimeType: string }): Promise<FoodRecognitionDraft>;
  writeMorningReflection(input: {
    locale: 'fa' | 'en';
    facts: { mealCount: number; unknownEnergyItemCount: number };
  }): Promise<ReflectionDraft>;
}

export class DisabledAiProvider implements AiProvider {
  private unavailable(): never {
    throw new Error('FEATURE_DISABLED');
  }
  async parseDietPlanImage(): Promise<PlanExtractionDraft> {
    return this.unavailable();
  }
  async recognizeMealPhoto(): Promise<FoodRecognitionDraft> {
    return this.unavailable();
  }
  async writeMorningReflection(): Promise<ReflectionDraft> {
    return this.unavailable();
  }
}
