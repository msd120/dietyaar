import 'server-only';
import { AiPurpose, ConsentPurpose, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  eligibilityInputSchema,
  isSupportedTimeZone,
  planContextInputSchema,
  preferencesInputSchema,
  profileBasicsInputSchema,
} from '@/services/profiles/onboarding-schema';
import { cancelAiWorkForPurpose } from '@/services/ai/ai-service';

export const POLICY_VERSION = '2026-11-16';

const aiPurposes = [
  ConsentPurpose.PLAN_IMAGE,
  ConsentPurpose.MEAL_IMAGE,
  ConsentPurpose.AI_REFLECTION,
] as const;

export async function saveOnboardingProgress(input: {
  userId: string;
  locale: 'fa' | 'en';
  step: number;
}) {
  return prisma.profile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      locale: input.locale,
      onboardingStep: input.step,
    },
    update: {
      locale: input.locale,
      onboardingStep: input.step,
    },
  });
}

export async function getOnboardingProgress(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    select: { onboardingStep: true, onboardingCompleteAt: true },
  });
}

export async function getOnboardingData(userId: string) {
  const [profile, preferences, consents] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.preferences.findUnique({ where: { userId } }),
    prisma.consent.findMany({ where: { userId } }),
  ]);
  return { profile, preferences, consents };
}

export async function saveEligibility(input: { userId: string; value: unknown }) {
  const value = eligibilityInputSchema.parse(input.value);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, age: value.age, onboardingStep: 3 },
      update: { age: value.age, onboardingStep: { set: 3 } },
    });
    await tx.consent.upsert({
      where: { userId_purpose: { userId: input.userId, purpose: ConsentPurpose.TERMS_PRIVACY } },
      create: {
        userId: input.userId,
        purpose: ConsentPurpose.TERMS_PRIVACY,
        policyVersion: POLICY_VERSION,
        grantedAt: now,
      },
      update: { policyVersion: POLICY_VERSION, grantedAt: now, revokedAt: null },
    });
    await Promise.all(
      aiPurposes.map((purpose) =>
        tx.consent.upsert({
          where: { userId_purpose: { userId: input.userId, purpose } },
          create: {
            userId: input.userId,
            purpose,
            policyVersion: POLICY_VERSION,
            grantedAt: value.aiConsent ? now : null,
            revokedAt: value.aiConsent ? null : now,
          },
          update: {
            policyVersion: POLICY_VERSION,
            grantedAt: value.aiConsent ? now : null,
            revokedAt: value.aiConsent ? null : now,
          },
        }),
      ),
    );
  });
}

export async function saveProfileBasics(input: { userId: string; value: unknown }) {
  const value = profileBasicsInputSchema.parse(input.value);
  const profileData = {
    preferredName: value.preferredName ?? null,
    unitSystem: value.unitSystem,
    heightCm: value.heightCm ?? null,
    profileWeightKg: value.profileWeightKg ?? null,
    gender: value.gender ?? null,
    genderSelfDescription: value.genderSelfDescription ?? null,
    birthYear: value.birthYear ?? null,
    birthYearCalendar: value.birthYearCalendar ?? null,
    onboardingStep: 4,
  } satisfies Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>;
  return prisma.profile.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, ...profileData },
    update: profileData,
  });
}

export async function savePlanContext(input: { userId: string; value: unknown }) {
  const value = planContextInputSchema.parse(input.value);
  return prisma.profile.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, ...value, onboardingStep: 5 },
    update: { ...value, onboardingStep: 5 },
  });
}

export async function savePreferences(input: { userId: string; value: unknown }) {
  const value = preferencesInputSchema.parse(input.value);
  if (!isSupportedTimeZone(value.timezone)) throw new Error('INVALID_TIMEZONE');
  return prisma.$transaction([
    prisma.profile.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        locale: value.locale,
        timezone: value.timezone,
        onboardingStep: 6,
      },
      update: { locale: value.locale, timezone: value.timezone, onboardingStep: 6 },
    }),
    prisma.preferences.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, theme: value.theme, morningTime: value.morningTime },
      update: { theme: value.theme, morningTime: value.morningTime },
    }),
  ]);
}

export async function completeOnboarding(userId: string) {
  return prisma.profile.update({
    where: { userId },
    data: { onboardingStep: 9, onboardingCompleteAt: new Date() },
  });
}

export async function updateProfileSettings(input: { userId: string; value: unknown }) {
  const value = profileBasicsInputSchema.parse(input.value);
  return prisma.profile.update({
    where: { userId: input.userId },
    data: {
      preferredName: value.preferredName ?? null,
      unitSystem: value.unitSystem,
      heightCm: value.heightCm ?? null,
      profileWeightKg: value.profileWeightKg ?? null,
      gender: value.gender ?? null,
      genderSelfDescription: value.genderSelfDescription ?? null,
      birthYear: value.birthYear ?? null,
      birthYearCalendar: value.birthYearCalendar ?? null,
    },
  });
}

export async function updatePreferenceSettings(input: { userId: string; value: unknown }) {
  const value = preferencesInputSchema.parse(input.value);
  if (!isSupportedTimeZone(value.timezone)) throw new Error('INVALID_TIMEZONE');
  return prisma.$transaction([
    prisma.profile.update({
      where: { userId: input.userId },
      data: { locale: value.locale, timezone: value.timezone },
    }),
    prisma.preferences.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        theme: value.theme,
        morningTime: value.morningTime,
        weightTrackingEnabled: value.weightTrackingEnabled ?? false,
      },
      update: {
        theme: value.theme,
        morningTime: value.morningTime,
        ...(value.weightTrackingEnabled === undefined
          ? {}
          : { weightTrackingEnabled: value.weightTrackingEnabled }),
      },
    }),
  ]);
}

export async function updateAiConsentSettings(input: {
  userId: string;
  grants: { planImage: boolean; mealImage: boolean; aiReflection: boolean };
}) {
  const now = new Date();
  const values = [
    [ConsentPurpose.PLAN_IMAGE, input.grants.planImage],
    [ConsentPurpose.MEAL_IMAGE, input.grants.mealImage],
    [ConsentPurpose.AI_REFLECTION, input.grants.aiReflection],
  ] as const;
  const result = await prisma.$transaction(
    values.map(([purpose, granted]) =>
      prisma.consent.upsert({
        where: { userId_purpose: { userId: input.userId, purpose } },
        create: {
          userId: input.userId,
          purpose,
          policyVersion: POLICY_VERSION,
          grantedAt: granted ? now : null,
          revokedAt: granted ? null : now,
        },
        update: {
          policyVersion: POLICY_VERSION,
          grantedAt: granted ? now : null,
          revokedAt: granted ? null : now,
        },
      }),
    ),
  );
  const revokedPurposes = values
    .filter(([, granted]) => !granted)
    .map(([purpose]) =>
      purpose === ConsentPurpose.PLAN_IMAGE
        ? AiPurpose.PLAN_IMAGE
        : purpose === ConsentPurpose.MEAL_IMAGE
          ? AiPurpose.MEAL_IMAGE
          : AiPurpose.REFLECTION,
    );
  await Promise.all(
    revokedPurposes.map((purpose) => cancelAiWorkForPurpose(input.userId, purpose)),
  );
  return result;
}
