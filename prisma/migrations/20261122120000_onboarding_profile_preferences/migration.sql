CREATE TYPE "Gender" AS ENUM ('WOMAN', 'MAN', 'NON_BINARY', 'SELF_DESCRIBED', 'PREFER_NOT_TO_SAY');
CREATE TYPE "BirthYearCalendar" AS ENUM ('JALALI', 'GREGORIAN');
CREATE TYPE "ConsentPurpose" AS ENUM ('TERMS_PRIVACY', 'PLAN_IMAGE', 'MEAL_IMAGE', 'AI_REFLECTION');
CREATE TYPE "Theme" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

ALTER TABLE "Profile"
  ADD COLUMN "heightCm" DECIMAL(8,3),
  ADD COLUMN "profileWeightKg" DECIMAL(8,3),
  ADD COLUMN "gender" "Gender",
  ADD COLUMN "genderSelfDescription" TEXT,
  ADD COLUMN "birthYear" INTEGER,
  ADD COLUMN "birthYearCalendar" "BirthYearCalendar",
  ADD COLUMN "planSource" TEXT,
  ADD COLUMN "medicalPlan" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dietaryNotes" TEXT,
  ADD CONSTRAINT "Profile_birth_year_pair_check" CHECK (
    ("birthYear" IS NULL AND "birthYearCalendar" IS NULL) OR
    ("birthYear" IS NOT NULL AND "birthYearCalendar" IS NOT NULL)
  ),
  ADD CONSTRAINT "Profile_measurements_positive_check" CHECK (
    ("heightCm" IS NULL OR "heightCm" > 0) AND
    ("profileWeightKg" IS NULL OR "profileWeightKg" > 0)
  ),
  ADD CONSTRAINT "Profile_gender_self_description_check" CHECK (
    ("gender" = 'SELF_DESCRIBED' AND "genderSelfDescription" IS NOT NULL) OR
    ("gender" IS DISTINCT FROM 'SELF_DESCRIBED' AND "genderSelfDescription" IS NULL)
  );

CREATE TABLE "Consent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" "ConsentPurpose" NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Preferences" (
  "userId" TEXT NOT NULL,
  "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
  "morningTime" TEXT NOT NULL DEFAULT '08:00',
  "weightTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Preferences_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "Preferences_morning_time_check" CHECK ("morningTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

CREATE UNIQUE INDEX "Consent_userId_purpose_key" ON "Consent"("userId", "purpose");
CREATE INDEX "Consent_userId_grantedAt_idx" ON "Consent"("userId", "grantedAt");
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Preferences" ADD CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
