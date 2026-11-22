import { describe, expect, it } from 'vitest';
import {
  DisabledAiProvider,
  mealRecognitionSchema,
  planExtractionSchema,
  reflectionTextSchema,
} from '@/services/ai/ai-provider';

describe('optional AI contract', () => {
  it('is disabled safely when no provider is configured', async () => {
    const provider = new DisabledAiProvider();
    await expect(provider.writeMorningReflection()).rejects.toThrow('FEATURE_DISABLED');
  });

  it('rejects malformed proposals and accepts versioned editable results', () => {
    expect(planExtractionSchema.safeParse({ title: 'missing metadata' }).success).toBe(false);
    expect(
      mealRecognitionSchema.safeParse({
        schemaVersion: 1,
        provider: 'mock',
        model: 'mock-v1',
        promptVersion: 'v1',
        assumptions: [],
        unresolvedFields: ['amount'],
        candidates: [{ name: 'خوراک', portionText: null, preparation: null, confidence: null }],
      }).success,
    ).toBe(true);
    expect(
      reflectionTextSchema.safeParse({
        schemaVersion: 1,
        provider: 'mock',
        model: 'mock-v1',
        promptVersion: 'v1',
        assumptions: [],
        unresolvedFields: [],
        locale: 'fa',
        text: '',
      }).success,
    ).toBe(false);
  });
});
