-- Manual core foundation: owner-scoped onboarding, plan drafts, meals, and day state.
-- This migration deliberately excludes media, AI, and immutable plan-version snapshots.

CREATE TYPE "Goal" AS ENUM ('LOSE_WEIGHT', 'MAINTAIN_WEIGHT', 'GAIN_WEIGHT');
CREATE TYPE "UnitSystem" AS ENUM ('METRIC', 'IMPERIAL');
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'UNPLANNED');
CREATE TYPE "MealDraftState" AS ENUM ('EDITING', 'READY_FOR_REVIEW', 'CONFIRMED', 'DISCARDED');
CREATE TYPE "MealStatus" AS ENUM ('CONFIRMED', 'DELETED');

CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "preferredName" TEXT,
    "age" INTEGER,
    "goal" "Goal",
    "unitSystem" "UnitSystem" NOT NULL DEFAULT 'METRIC',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingCompleteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "Profile_age_check" CHECK ("age" IS NULL OR "age" >= 18),
    CONSTRAINT "Profile_onboardingStep_check" CHECK ("onboardingStep" >= 1 AND "onboardingStep" <= 9),
    CONSTRAINT "Profile_locale_check" CHECK ("locale" IN ('fa', 'en'))
);

CREATE TABLE "PlanDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanDraft_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlanDraft_revision_check" CHECK ("revision" >= 1)
);

CREATE TABLE "MealDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" "MealDraftState" NOT NULL DEFAULT 'EDITING',
    "consumedAtUtc" TIMESTAMP(3) NOT NULL,
    "localDate" DATE NOT NULL,
    "timezoneAtEntry" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MealDraft_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MealDraft_revision_check" CHECK ("revision" >= 1)
);

CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MealStatus" NOT NULL DEFAULT 'CONFIRMED',
    "consumedAtUtc" TIMESTAMP(3) NOT NULL,
    "localDate" DATE NOT NULL,
    "timezoneAtEntry" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Meal_revision_check" CHECK ("revision" >= 1)
);

CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "grams" DECIMAL(12,4),
    "energyKcal" DECIMAL(12,4),
    "proteinG" DECIMAL(12,4),
    "carbohydrateG" DECIMAL(12,4),
    "fatG" DECIMAL(12,4),
    "fiberG" DECIMAL(12,4),
    "sourceType" TEXT NOT NULL,
    "snapshotBasis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MealItem_nonnegative_check" CHECK (
      ("grams" IS NULL OR "grams" >= 0) AND
      ("energyKcal" IS NULL OR "energyKcal" >= 0) AND
      ("proteinG" IS NULL OR "proteinG" >= 0) AND
      ("carbohydrateG" IS NULL OR "carbohydrateG" >= 0) AND
      ("fatG" IS NULL OR "fatG" >= 0) AND
      ("fiberG" IS NULL OR "fiberG" >= 0)
    )
);

CREATE TABLE "DayState" (
    "userId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "completedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DayState_pkey" PRIMARY KEY ("userId", "localDate"),
    CONSTRAINT "DayState_revision_check" CHECK ("revision" >= 1)
);

CREATE INDEX "PlanDraft_userId_updatedAt_idx" ON "PlanDraft"("userId", "updatedAt");
CREATE INDEX "MealDraft_userId_state_updatedAt_idx" ON "MealDraft"("userId", "state", "updatedAt");
CREATE INDEX "MealDraft_userId_localDate_consumedAtUtc_idx" ON "MealDraft"("userId", "localDate", "consumedAtUtc");
CREATE INDEX "Meal_userId_localDate_consumedAtUtc_idx" ON "Meal"("userId", "localDate", "consumedAtUtc");
CREATE INDEX "MealItem_mealId_idx" ON "MealItem"("mealId");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanDraft" ADD CONSTRAINT "PlanDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealDraft" ADD CONSTRAINT "MealDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DayState" ADD CONSTRAINT "DayState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
