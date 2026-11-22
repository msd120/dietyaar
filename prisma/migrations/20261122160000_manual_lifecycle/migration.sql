ALTER TABLE "Meal"
  ADD COLUMN "pendingDeletionUntil" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Meal_userId_pendingDeletionUntil_idx" ON "Meal"("userId", "pendingDeletionUntil");

CREATE TABLE "SavedMeal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedMeal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedMeal_userId_updatedAt_idx" ON "SavedMeal"("userId", "updatedAt");
ALTER TABLE "SavedMeal" ADD CONSTRAINT "SavedMeal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
