import { z } from 'zod';
import { normalizeInput } from '@/lib/persian';

const optionalText = (maximum: number) =>
  z.preprocess((value) => {
    const normalized = normalizeInput(typeof value === 'string' ? value : '');
    return normalized === '' ? undefined : normalized;
  }, z.string().max(maximum).optional());

const optionalPositiveNumber = (maximum: number) =>
  z.preprocess((value) => {
    const normalized = normalizeInput(typeof value === 'string' ? value : '');
    return normalized === '' ? undefined : Number(normalized);
  }, z.number().finite().positive().max(maximum).optional());

export const eligibilityInputSchema = z.object({
  age: z.preprocess(
    (value) => Number(normalizeInput(String(value))),
    z.number().int().min(18).max(120),
  ),
  acceptTerms: z.literal(true),
  aiConsent: z.boolean(),
});

export const profileBasicsInputSchema = z
  .object({
    preferredName: optionalText(80),
    unitSystem: z.enum(['METRIC', 'IMPERIAL']),
    heightCm: optionalPositiveNumber(300),
    profileWeightKg: optionalPositiveNumber(600),
    gender: z
      .enum(['WOMAN', 'MAN', 'NON_BINARY', 'SELF_DESCRIBED', 'PREFER_NOT_TO_SAY'])
      .optional(),
    genderSelfDescription: optionalText(80),
    birthYear: z.preprocess((value) => {
      const normalized = normalizeInput(typeof value === 'string' ? value : '');
      return normalized === '' ? undefined : Number(normalized);
    }, z.number().int().min(1200).max(2500).optional()),
    birthYearCalendar: z.enum(['JALALI', 'GREGORIAN']).optional(),
  })
  .superRefine((value, context) => {
    if ((value.birthYear === undefined) !== (value.birthYearCalendar === undefined)) {
      context.addIssue({
        code: 'custom',
        message: 'Birth year and calendar must be provided together.',
      });
    }
    if (value.gender === 'SELF_DESCRIBED' && !value.genderSelfDescription) {
      context.addIssue({
        code: 'custom',
        path: ['genderSelfDescription'],
        message: 'A description is required.',
      });
    }
    if (value.gender !== 'SELF_DESCRIBED' && value.genderSelfDescription) {
      context.addIssue({
        code: 'custom',
        path: ['genderSelfDescription'],
        message: 'Select self-described first.',
      });
    }
  });

export const planContextInputSchema = z.object({
  goal: z.enum(['LOSE_WEIGHT', 'MAINTAIN_WEIGHT', 'GAIN_WEIGHT']),
  planSource: z.enum(['DIETITIAN', 'COACH', 'SELF', 'UNSPECIFIED']),
  medicalPlan: z.boolean(),
  dietaryNotes: optionalText(500),
});

export const preferencesInputSchema = z.object({
  timezone: z.string().trim().min(1).max(64),
  morningTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
  theme: z.enum(['SYSTEM', 'LIGHT', 'DARK']),
  locale: z.enum(['fa', 'en']),
  weightTrackingEnabled: z.boolean().optional(),
});

export function isSupportedTimeZone(timezone: string) {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
