CREATE TYPE "PlanDraftState" AS ENUM ('EDITING', 'READY_FOR_REVIEW', 'ACTIVATED', 'ARCHIVED');
CREATE TYPE "PlanSourceType" AS ENUM ('MANUAL', 'IMAGE');
CREATE TYPE "PlanVersionStatus" AS ENUM ('ACTIVE', 'SCHEDULED', 'HISTORICAL');

ALTER TABLE "PlanDraft"
  ADD COLUMN "sourceNote" TEXT,
  ADD COLUMN "sourceType" "PlanSourceType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "state" "PlanDraftState" NOT NULL DEFAULT 'EDITING',
  ADD COLUMN "medicalBoundary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "content" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "DietPlanVersion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "PlanVersionStatus" NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  "effectiveTo" DATE,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "sourceType" "PlanSourceType" NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DietPlanVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DietPlanVersion_dates_check" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);

CREATE INDEX "DietPlanVersion_userId_effectiveFrom_idx" ON "DietPlanVersion"("userId", "effectiveFrom");
CREATE INDEX "DietPlanVersion_userId_status_idx" ON "DietPlanVersion"("userId", "status");
ALTER TABLE "DietPlanVersion" ADD CONSTRAINT "DietPlanVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
