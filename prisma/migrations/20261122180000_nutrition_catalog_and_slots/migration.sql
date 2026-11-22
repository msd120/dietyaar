CREATE TYPE "CatalogReleaseState" AS ENUM ('DEVELOPMENT_FIXTURE', 'APPROVED');

ALTER TABLE "MealDraft" ADD COLUMN "linkedSlotId" TEXT;
ALTER TABLE "MealDraftItem"
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "sourceVersion" TEXT;
ALTER TABLE "MealItem"
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "sourceVersion" TEXT;

CREATE TABLE "CatalogVersion" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "sourceDocument" TEXT NOT NULL,
  "licenseNote" TEXT NOT NULL,
  "releaseState" "CatalogReleaseState" NOT NULL DEFAULT 'DEVELOPMENT_FIXTURE',
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogFood" (
  "id" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "canonicalNameFa" TEXT NOT NULL,
  "canonicalNameEn" TEXT,
  "normalizedNameFa" TEXT NOT NULL,
  "normalizedNameEn" TEXT,
  "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "basisGrams" DECIMAL(12,4) NOT NULL DEFAULT 100,
  "energyKcal" DECIMAL(12,4),
  "proteinG" DECIMAL(12,4),
  "carbohydrateG" DECIMAL(12,4),
  "fatG" DECIMAL(12,4),
  "fiberG" DECIMAL(12,4),
  "confidenceLabel" TEXT NOT NULL,
  "sourceCitation" TEXT NOT NULL,
  "sourceFoodId" TEXT,
  CONSTRAINT "CatalogFood_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogServing" (
  "id" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "labelFa" TEXT NOT NULL,
  "labelEn" TEXT,
  "grams" DECIMAL(12,4) NOT NULL,
  "notes" TEXT,
  CONSTRAINT "CatalogServing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserFood" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "basisAmount" DECIMAL(12,4) NOT NULL,
  "basisUnit" TEXT NOT NULL,
  "energyKcal" DECIMAL(12,4),
  "proteinG" DECIMAL(12,4),
  "carbohydrateG" DECIMAL(12,4),
  "fatG" DECIMAL(12,4),
  "fiberG" DECIMAL(12,4),
  "sourceNote" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserFood_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogVersion_version_key" ON "CatalogVersion"("version");
CREATE INDEX "CatalogFood_versionId_normalizedNameEn_idx" ON "CatalogFood"("versionId", "normalizedNameEn");
CREATE UNIQUE INDEX "CatalogFood_versionId_normalizedNameFa_key" ON "CatalogFood"("versionId", "normalizedNameFa");
CREATE INDEX "CatalogServing_foodId_idx" ON "CatalogServing"("foodId");
CREATE INDEX "UserFood_userId_updatedAt_idx" ON "UserFood"("userId", "updatedAt");
CREATE UNIQUE INDEX "UserFood_userId_normalizedName_key" ON "UserFood"("userId", "normalizedName");

ALTER TABLE "CatalogFood" ADD CONSTRAINT "CatalogFood_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CatalogVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogServing" ADD CONSTRAINT "CatalogServing_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "CatalogFood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFood" ADD CONSTRAINT "UserFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
