'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import {
  confirmMealDraft,
  createManualMealDraft,
  requestMealDeletion,
  reviseConfirmedMeal,
  undoMealDeletion,
} from '@/services/meals/meal-service';
import {
  createDraftFromSavedMeal,
  deleteSavedMeal,
  renameSavedMeal,
  saveMealSnapshot,
} from '@/services/meals/saved-meal-service';
import { setDayComplete } from '@/services/days/day-service';
import { setSlotSkipped } from '@/services/days/slot-service';
import {
  activateManualPlan,
  activateHistoricalPlanCorrection,
  clonePlanVersionToDraft,
  createManualPlanDraft,
  updateManualPlanDraft,
} from '@/services/plans/plan-service';
import {
  completeOnboarding,
  saveEligibility,
  saveOnboardingProgress,
  savePlanContext,
  savePreferences,
  saveProfileBasics,
  updateAiConsentSettings,
  updatePreferenceSettings,
  updateProfileSettings,
} from '@/services/profiles/profile-service';
import {
  addWeightEntry,
  deleteWeightEntry,
  updateWeightEntry,
} from '@/services/weights/weight-service';
import { setReflectionFeedback } from '@/services/reflections/reflection-service';
import { createUserFood, deleteUserFood } from '@/services/nutrition/nutrition-service';

const localeSchema = z.enum(['fa', 'en']);
const onboardingInputSchema = z.object({
  locale: localeSchema,
  nextStep: z.coerce.number().int().min(1).max(9),
});
const onboardingStepInputSchema = z.object({ locale: localeSchema, value: z.unknown() });
const optionalPositiveNumber = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().positive().max(10000).optional(),
);
const optionalNonnegativeNumber = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().nonnegative().max(100_000).optional(),
);
const manualMealInputSchema = z
  .object({
    locale: localeSchema,
    displayName: z.string().trim().min(1).max(120),
    grams: optionalPositiveNumber,
    energyKcal: optionalNonnegativeNumber,
    proteinG: optionalNonnegativeNumber,
    carbohydrateG: optionalNonnegativeNumber,
    fatG: optionalNonnegativeNumber,
    fiberG: optionalNonnegativeNumber,
    linkedSlotId: z
      .string()
      .regex(/^[a-z0-9-]{1,40}$/)
      .optional(),
    sourceType: z.enum(['CATALOG', 'USER_FOOD']).optional(),
    sourceId: z.string().cuid().optional(),
    servingId: z.string().cuid().optional(),
  })
  .superRefine((value, context) => {
    if ((value.sourceType === undefined) !== (value.sourceId === undefined)) {
      context.addIssue({
        code: 'custom',
        path: ['sourceId'],
        message: 'Source type and ID must match.',
      });
    }
  });
const draftInputSchema = z.object({ locale: localeSchema, draftId: z.string().cuid() });
const planDraftSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().max(120).optional(),
});
const planUpdateSchema = z.object({
  locale: localeSchema,
  draftId: z.string().cuid(),
  revision: z.number().int().positive(),
  title: z.string().trim().max(120).optional(),
  sourceNote: z.string().trim().max(1000).optional(),
  content: z.record(z.string(), z.unknown()),
  medicalBoundary: z.boolean(),
});
const planActivationSchema = z.object({
  locale: localeSchema,
  draftId: z.string().cuid(),
  revision: z.number().int().positive(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  correctionReason: z.string().trim().max(500).optional(),
});

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('UNAUTHORIZED');
  return session.user.id;
}

export async function saveOnboardingProgressAction(input: unknown) {
  const parsed = onboardingInputSchema.parse(input);
  const userId = await requireUserId();
  await saveOnboardingProgress({ userId, locale: parsed.locale, step: parsed.nextStep });
  revalidatePath(`/${parsed.locale}`);
}

export async function saveEligibilityAction(input: unknown) {
  const parsed = onboardingStepInputSchema.parse(input);
  await saveEligibility({ userId: await requireUserId(), value: parsed.value });
  revalidatePath(`/${parsed.locale}/onboarding`);
}

export async function saveProfileBasicsAction(input: unknown) {
  const parsed = onboardingStepInputSchema.parse(input);
  await saveProfileBasics({ userId: await requireUserId(), value: parsed.value });
  revalidatePath(`/${parsed.locale}/onboarding`);
}

export async function savePlanContextAction(input: unknown) {
  const parsed = onboardingStepInputSchema.parse(input);
  await savePlanContext({ userId: await requireUserId(), value: parsed.value });
  revalidatePath(`/${parsed.locale}/onboarding`);
}

export async function savePreferencesAction(input: unknown) {
  const parsed = onboardingStepInputSchema.parse(input);
  await savePreferences({ userId: await requireUserId(), value: parsed.value });
  revalidatePath(`/${parsed.locale}/onboarding`);
}

export async function completeOnboardingAction(input: unknown) {
  const parsed = z.object({ locale: localeSchema }).parse(input);
  await completeOnboarding(await requireUserId());
  revalidatePath(`/${parsed.locale}/onboarding`);
}

export async function createManualMealDraftAction(input: unknown) {
  const parsed = manualMealInputSchema.parse(input);
  const userId = await requireUserId();
  const draft = await createManualMealDraft({
    userId,
    displayName: parsed.displayName,
    grams: parsed.grams,
    energyKcal: parsed.energyKcal,
    proteinG: parsed.proteinG,
    carbohydrateG: parsed.carbohydrateG,
    fatG: parsed.fatG,
    fiberG: parsed.fiberG,
    linkedSlotId: parsed.linkedSlotId,
    source:
      parsed.sourceType && parsed.sourceId
        ? parsed.sourceType === 'CATALOG'
          ? { type: 'CATALOG', foodId: parsed.sourceId, servingId: parsed.servingId }
          : { type: 'USER_FOOD', foodId: parsed.sourceId }
        : undefined,
  });
  revalidatePath(`/${parsed.locale}/meals/new`);
  return draft;
}

export async function createUserFoodAction(input: unknown) {
  const parsed = z
    .object({
      locale: localeSchema,
      name: z.string().trim().min(1).max(120),
      basisAmount: z.coerce.number().positive().max(100_000),
      energyKcal: optionalNonnegativeNumber,
      proteinG: optionalNonnegativeNumber,
      carbohydrateG: optionalNonnegativeNumber,
      fatG: optionalNonnegativeNumber,
      fiberG: optionalNonnegativeNumber,
      sourceNote: z.string().trim().max(500).optional(),
    })
    .parse(input);
  await createUserFood({
    ...parsed,
    userId: await requireUserId(),
    basisUnit: 'g',
  });
  revalidatePath(`/${parsed.locale}/meals/new`);
}

export async function deleteUserFoodAction(input: unknown) {
  const parsed = ownedEntitySchema.parse(input);
  await deleteUserFood({ userId: await requireUserId(), foodId: parsed.id });
  revalidatePath(`/${parsed.locale}/meals/new`);
}

export async function confirmMealDraftAction(input: unknown) {
  const parsed = draftInputSchema.parse(input);
  const userId = await requireUserId();
  await confirmMealDraft({ userId, draftId: parsed.draftId });
  revalidatePath(`/${parsed.locale}/today`);
  revalidatePath(`/${parsed.locale}/history`);
}

export async function createManualPlanDraftAction(input: unknown) {
  const parsed = planDraftSchema.parse(input);
  const draft = await createManualPlanDraft(await requireUserId(), parsed.title);
  revalidatePath(`/${parsed.locale}/plan`);
  return draft;
}

export async function updateManualPlanDraftAction(input: unknown) {
  const parsed = planUpdateSchema.parse(input);
  const draft = await updateManualPlanDraft({
    ...parsed,
    userId: await requireUserId(),
    content: parsed.content as Prisma.InputJsonValue,
  });
  revalidatePath(`/${parsed.locale}/plan`);
  return draft;
}

export async function activateManualPlanAction(input: unknown) {
  const parsed = planActivationSchema.parse(input);
  const userId = await requireUserId();
  const version = parsed.correctionReason
    ? await activateHistoricalPlanCorrection({
        userId,
        draftId: parsed.draftId,
        revision: parsed.revision,
        effectiveFrom: parsed.effectiveFrom,
        reason: parsed.correctionReason,
      })
    : await activateManualPlan({ ...parsed, userId });
  revalidatePath(`/${parsed.locale}/plan`);
  revalidatePath(`/${parsed.locale}/today`);
  return version;
}

export async function clonePlanVersionAction(input: unknown) {
  const parsed = ownedEntitySchema.parse(input);
  const draft = await clonePlanVersionToDraft({
    userId: await requireUserId(),
    versionId: parsed.id,
  });
  revalidatePath(`/${parsed.locale}/plan`);
  return { id: draft.id };
}

export async function addWeightEntryAction(input: unknown) {
  const parsed = z
    .object({
      locale: localeSchema,
      measuredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weightKg: z.coerce.number().positive().max(600),
      note: z.string().trim().max(200).optional(),
    })
    .parse(input);
  await addWeightEntry({ ...parsed, userId: await requireUserId() });
  revalidatePath(`/${parsed.locale}/history`);
}

export async function updateProfileSettingsAction(input: unknown) {
  const parsed = onboardingStepInputSchema.parse(input);
  await updateProfileSettings({ userId: await requireUserId(), value: parsed.value });
  revalidatePath(`/${parsed.locale}/settings`);
}

export async function updatePreferenceSettingsAction(input: unknown) {
  const parsed = onboardingStepInputSchema.parse(input);
  await updatePreferenceSettings({ userId: await requireUserId(), value: parsed.value });
  revalidatePath(`/${parsed.locale}/settings`);
}

export async function updateAiConsentSettingsAction(input: unknown) {
  const parsed = z
    .object({
      locale: localeSchema,
      grants: z.object({
        planImage: z.boolean(),
        mealImage: z.boolean(),
        aiReflection: z.boolean(),
      }),
    })
    .parse(input);
  await updateAiConsentSettings({ userId: await requireUserId(), grants: parsed.grants });
  revalidatePath(`/${parsed.locale}/settings`);
}

const ownedEntitySchema = z.object({ locale: localeSchema, id: z.string().cuid() });

export async function requestMealDeletionAction(input: unknown) {
  const parsed = ownedEntitySchema.parse(input);
  await requestMealDeletion({ userId: await requireUserId(), mealId: parsed.id });
  revalidatePath(`/${parsed.locale}/today`);
}

export async function undoMealDeletionAction(input: unknown) {
  const parsed = ownedEntitySchema.parse(input);
  await undoMealDeletion({ userId: await requireUserId(), mealId: parsed.id });
  revalidatePath(`/${parsed.locale}/today`);
}

export async function reviseConfirmedMealAction(input: unknown) {
  const parsed = z
    .object({
      locale: localeSchema,
      id: z.string().cuid(),
      expectedRevision: z.number().int().positive(),
      displayName: z.string().trim().min(1).max(120),
      grams: optionalPositiveNumber,
      energyKcal: optionalPositiveNumber,
    })
    .parse(input);
  await reviseConfirmedMeal({
    userId: await requireUserId(),
    mealId: parsed.id,
    expectedRevision: parsed.expectedRevision,
    displayName: parsed.displayName,
    grams: parsed.grams,
    energyKcal: parsed.energyKcal,
  });
  revalidatePath(`/${parsed.locale}/today`);
  revalidatePath(`/${parsed.locale}/history`);
}

export async function saveMealSnapshotAction(input: unknown) {
  const parsed = ownedEntitySchema.extend({ name: z.string().trim().min(1).max(120) }).parse(input);
  await saveMealSnapshot({ userId: await requireUserId(), mealId: parsed.id, name: parsed.name });
  revalidatePath(`/${parsed.locale}/meals/new`);
}

export async function createDraftFromSavedMealAction(input: unknown) {
  const parsed = ownedEntitySchema.parse(input);
  const draft = await createDraftFromSavedMeal({
    userId: await requireUserId(),
    savedMealId: parsed.id,
  });
  return { id: draft.id };
}

export async function renameSavedMealAction(input: unknown) {
  const parsed = ownedEntitySchema.extend({ name: z.string().trim().min(1).max(120) }).parse(input);
  await renameSavedMeal({
    userId: await requireUserId(),
    savedMealId: parsed.id,
    name: parsed.name,
  });
  revalidatePath(`/${parsed.locale}/meals/new`);
}

export async function deleteSavedMealAction(input: unknown) {
  const parsed = ownedEntitySchema.parse(input);
  await deleteSavedMeal({ userId: await requireUserId(), savedMealId: parsed.id });
  revalidatePath(`/${parsed.locale}/meals/new`);
}

export async function setReflectionFeedbackAction(input: unknown) {
  const parsed = ownedEntitySchema
    .extend({ value: z.enum(['HELPFUL', 'NOT_HELPFUL']).nullable() })
    .parse(input);
  await setReflectionFeedback({
    userId: await requireUserId(),
    reflectionId: parsed.id,
    value: parsed.value,
  });
  revalidatePath(`/${parsed.locale}/today`);
}

export async function setDayCompleteAction(input: unknown) {
  const parsed = z
    .object({
      locale: localeSchema,
      localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      complete: z.boolean(),
    })
    .parse(input);
  await setDayComplete({
    userId: await requireUserId(),
    localDate: parsed.localDate,
    complete: parsed.complete,
  });
  revalidatePath(`/${parsed.locale}/today`);
}

export async function setSlotSkippedAction(input: unknown) {
  const parsed = z
    .object({
      locale: localeSchema,
      localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      planVersionId: z.string().cuid(),
      slotId: z.string().regex(/^[a-z0-9-]{1,40}$/),
      skipped: z.boolean(),
    })
    .parse(input);
  await setSlotSkipped({ userId: await requireUserId(), ...parsed });
  revalidatePath(`/${parsed.locale}/today`);
  revalidatePath(`/${parsed.locale}/history`);
}

export async function deleteWeightEntryAction(input: unknown) {
  const parsed = ownedEntitySchema.parse(input);
  await deleteWeightEntry({ userId: await requireUserId(), entryId: parsed.id });
  revalidatePath(`/${parsed.locale}/history`);
}

export async function updateWeightEntryAction(input: unknown) {
  const parsed = ownedEntitySchema
    .extend({
      measuredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weightKg: z.coerce.number().positive().max(600),
      note: z.string().trim().max(200).optional(),
    })
    .parse(input);
  await updateWeightEntry({
    userId: await requireUserId(),
    entryId: parsed.id,
    measuredOn: parsed.measuredOn,
    weightKg: parsed.weightKg,
    note: parsed.note,
  });
  revalidatePath(`/${parsed.locale}/history`);
}
