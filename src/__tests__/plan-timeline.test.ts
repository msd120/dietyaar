import { describe, expect, it } from 'vitest';
import { defaultEffectiveDate, hasTimelineConflict } from '@/domain/plans/timeline';

describe('plan timeline', () => {
  it('uses today for a first plan and tomorrow for a replacement', () => {
    expect(defaultEffectiveDate('2026-11-22', false)).toBe('2026-11-22');
    expect(defaultEffectiveDate('2026-11-22', true)).toBe('2026-11-23');
  });

  it('detects overlapping effective intervals', () => {
    expect(
      hasTimelineConflict({ id: 'candidate', effectiveFrom: '2026-11-20', effectiveTo: null }, [
        { id: 'active', effectiveFrom: '2026-11-01', effectiveTo: null },
      ]),
    ).toBe(true);
  });

  it('allows adjacent non-overlapping intervals', () => {
    expect(
      hasTimelineConflict({ id: 'candidate', effectiveFrom: '2026-11-21', effectiveTo: null }, [
        { id: 'old', effectiveFrom: '2026-11-01', effectiveTo: '2026-11-20' },
      ]),
    ).toBe(false);
  });
});
