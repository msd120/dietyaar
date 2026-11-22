CREATE TYPE "SlotExplicitState" AS ENUM ('SKIPPED');
CREATE TYPE "ReflectionFeedbackValue" AS ENUM ('HELPFUL', 'NOT_HELPFUL');
CREATE TYPE "MediaPurpose" AS ENUM ('PLAN_IMAGE', 'MEAL_IMAGE');
CREATE TYPE "MediaState" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'READY', 'INVALID', 'DELETING', 'DELETED', 'EXPIRED');
CREATE TYPE "JobType" AS ENUM ('PLAN_IMAGE_EXTRACT', 'MEAL_PHOTO_RECOGNIZE', 'AI_REFLECTION', 'EXPORT_BUILD', 'MEDIA_DELETE', 'MEDIA_EXPIRE', 'SUMMARY_REBUILD');
CREATE TYPE "JobState" AS ENUM ('QUEUED', 'RUNNING', 'RETRY_WAIT', 'SUCCEEDED', 'FAILED', 'CANCELED', 'SUPERSEDED');
CREATE TYPE "AiPurpose" AS ENUM ('PLAN_IMAGE', 'MEAL_IMAGE', 'REFLECTION');
CREATE TYPE "AiAnalysisState" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'SUPERSEDED');

ALTER TABLE "DietPlanVersion" ADD COLUMN "correctionReason" TEXT;
ALTER TABLE "Meal" ADD COLUMN "slotId" TEXT;
ALTER TABLE "WeightEntry" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "MealRevision" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mealId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MealRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanSlotOccurrence" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "localDate" DATE NOT NULL,
  "planVersionId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "explicitState" "SlotExplicitState",
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanSlotOccurrence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReflectionFeedback" (
  "reflectionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "value" "ReflectionFeedbackValue" NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReflectionFeedback_pkey" PRIMARY KEY ("reflectionId", "userId")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "objectPath" TEXT NOT NULL,
  "purpose" "MediaPurpose" NOT NULL,
  "state" "MediaState" NOT NULL DEFAULT 'PENDING_UPLOAD',
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "sha256" TEXT,
  "retentionDeadline" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "JobType" NOT NULL,
  "state" "JobState" NOT NULL DEFAULT 'QUEUED',
  "payloadVersion" INTEGER NOT NULL DEFAULT 1,
  "payloadJson" JSONB NOT NULL,
  "resultJson" JSONB,
  "idempotencyKey" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseOwner" TEXT,
  "leaseUntil" TIMESTAMP(3),
  "safeErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiAnalysis" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "purpose" "AiPurpose" NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputMediaId" TEXT,
  "draftType" TEXT NOT NULL,
  "draftId" TEXT NOT NULL,
  "draftRevision" INTEGER NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "promptVersion" TEXT NOT NULL,
  "state" "AiAnalysisState" NOT NULL DEFAULT 'QUEUED',
  "safeErrorCode" TEXT,
  "tokenUsageJson" JSONB,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AiAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MealRevision_userId_createdAt_idx" ON "MealRevision"("userId", "createdAt");
CREATE UNIQUE INDEX "MealRevision_mealId_revision_key" ON "MealRevision"("mealId", "revision");
CREATE INDEX "PlanSlotOccurrence_userId_localDate_idx" ON "PlanSlotOccurrence"("userId", "localDate");
CREATE UNIQUE INDEX "PlanSlotOccurrence_userId_localDate_planVersionId_slotId_key" ON "PlanSlotOccurrence"("userId", "localDate", "planVersionId", "slotId");
CREATE INDEX "ReflectionFeedback_userId_updatedAt_idx" ON "ReflectionFeedback"("userId", "updatedAt");
CREATE UNIQUE INDEX "MediaAsset_objectPath_key" ON "MediaAsset"("objectPath");
CREATE INDEX "MediaAsset_userId_purpose_state_idx" ON "MediaAsset"("userId", "purpose", "state");
CREATE INDEX "MediaAsset_state_retentionDeadline_idx" ON "MediaAsset"("state", "retentionDeadline");
CREATE UNIQUE INDEX "Job_idempotencyKey_key" ON "Job"("idempotencyKey");
CREATE INDEX "Job_state_runAfter_idx" ON "Job"("state", "runAfter");
CREATE INDEX "Job_userId_createdAt_idx" ON "Job"("userId", "createdAt");
CREATE UNIQUE INDEX "AiAnalysis_jobId_key" ON "AiAnalysis"("jobId");
CREATE INDEX "AiAnalysis_userId_purpose_createdAt_idx" ON "AiAnalysis"("userId", "purpose", "createdAt");
CREATE INDEX "AiAnalysis_inputMediaId_idx" ON "AiAnalysis"("inputMediaId");

ALTER TABLE "MealRevision" ADD CONSTRAINT "MealRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealRevision" ADD CONSTRAINT "MealRevision_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanSlotOccurrence" ADD CONSTRAINT "PlanSlotOccurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanSlotOccurrence" ADD CONSTRAINT "PlanSlotOccurrence_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "DietPlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReflectionFeedback" ADD CONSTRAINT "ReflectionFeedback_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "Reflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReflectionFeedback" ADD CONSTRAINT "ReflectionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_inputMediaId_fkey" FOREIGN KEY ("inputMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
