-- Persists manual draft items until the user explicitly confirms the meal.

CREATE TABLE "MealDraftItem" (
    "id" TEXT NOT NULL,
    "mealDraftId" TEXT NOT NULL,
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
    CONSTRAINT "MealDraftItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MealDraftItem_nonnegative_check" CHECK (
      ("grams" IS NULL OR "grams" >= 0) AND
      ("energyKcal" IS NULL OR "energyKcal" >= 0) AND
      ("proteinG" IS NULL OR "proteinG" >= 0) AND
      ("carbohydrateG" IS NULL OR "carbohydrateG" >= 0) AND
      ("fatG" IS NULL OR "fatG" >= 0) AND
      ("fiberG" IS NULL OR "fiberG" >= 0)
    )
);

CREATE INDEX "MealDraftItem_mealDraftId_idx" ON "MealDraftItem"("mealDraftId");

ALTER TABLE "MealDraftItem" ADD CONSTRAINT "MealDraftItem_mealDraftId_fkey"
  FOREIGN KEY ("mealDraftId") REFERENCES "MealDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
