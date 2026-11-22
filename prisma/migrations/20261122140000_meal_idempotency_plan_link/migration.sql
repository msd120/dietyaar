ALTER TABLE "Meal"
  ADD COLUMN "sourceDraftId" TEXT,
  ADD COLUMN "planVersionId" TEXT;

CREATE UNIQUE INDEX "Meal_sourceDraftId_key" ON "Meal"("sourceDraftId");
CREATE INDEX "Meal_planVersionId_idx" ON "Meal"("planVersionId");

ALTER TABLE "Meal" ADD CONSTRAINT "Meal_sourceDraftId_fkey"
  FOREIGN KEY ("sourceDraftId") REFERENCES "MealDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_planVersionId_fkey"
  FOREIGN KEY ("planVersionId") REFERENCES "DietPlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
