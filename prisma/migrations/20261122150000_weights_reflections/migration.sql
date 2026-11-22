CREATE TABLE "WeightEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "measuredOn" DATE NOT NULL,
  "weightKg" DECIMAL(8,3) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeightEntry_positive_check" CHECK ("weightKg" > 0)
);

CREATE TABLE "Reflection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "localDate" DATE NOT NULL,
  "sourceRevision" INTEGER NOT NULL,
  "templateKey" TEXT NOT NULL,
  "facts" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeightEntry_userId_measuredOn_idx" ON "WeightEntry"("userId", "measuredOn");
CREATE UNIQUE INDEX "Reflection_userId_localDate_key" ON "Reflection"("userId", "localDate");
CREATE INDEX "Reflection_userId_createdAt_idx" ON "Reflection"("userId", "createdAt");
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
