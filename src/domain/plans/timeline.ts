export type PlanInterval = {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
};

function compareDate(left: string, right: string) {
  return left.localeCompare(right);
}

export function defaultEffectiveDate(today: string, hasExistingPlan: boolean) {
  if (!hasExistingPlan) return today;
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function intervalsOverlap(left: PlanInterval, right: PlanInterval) {
  const leftEndsAfterRightStarts =
    !left.effectiveTo || compareDate(left.effectiveTo, right.effectiveFrom) >= 0;
  const rightEndsAfterLeftStarts =
    !right.effectiveTo || compareDate(right.effectiveTo, left.effectiveFrom) >= 0;
  return leftEndsAfterRightStarts && rightEndsAfterLeftStarts;
}

export function hasTimelineConflict(candidate: PlanInterval, existing: PlanInterval[]) {
  return existing.some(
    (interval) => interval.id !== candidate.id && intervalsOverlap(candidate, interval),
  );
}
