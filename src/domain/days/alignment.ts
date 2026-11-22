import type { AggregatedNutrient } from '@/domain/nutrition/nutrition';

export type TargetRule =
  | { type: 'MIN'; minimum: number }
  | { type: 'MAX'; maximum: number }
  | { type: 'RANGE'; minimum: number; maximum: number }
  | { type: 'EXACT'; exact: number };

export type AlignmentStatus = 'ABOVE' | 'BELOW' | 'WITHIN' | 'EXACT' | 'PARTIAL' | 'UNKNOWN';

function upperBound(rule: TargetRule) {
  if (rule.type === 'MAX' || rule.type === 'RANGE') return rule.maximum;
  if (rule.type === 'EXACT') return rule.exact;
  return null;
}

export function evaluateTarget(input: {
  nutrient: AggregatedNutrient;
  rule: TargetRule;
  dayComplete: boolean;
}): { status: AlignmentStatus; knownAlreadyAbove: boolean } {
  const { knownTotal, unknownItemCount } = input.nutrient;
  const upper = upperBound(input.rule);
  if (upper !== null && knownTotal > upper) {
    return { status: 'ABOVE', knownAlreadyAbove: unknownItemCount > 0 || !input.dayComplete };
  }
  if (unknownItemCount > 0) return { status: 'UNKNOWN', knownAlreadyAbove: false };
  if (!input.dayComplete) return { status: 'PARTIAL', knownAlreadyAbove: false };
  if (input.rule.type === 'MIN') {
    return {
      status: knownTotal < input.rule.minimum ? 'BELOW' : 'WITHIN',
      knownAlreadyAbove: false,
    };
  }
  if (input.rule.type === 'MAX') return { status: 'WITHIN', knownAlreadyAbove: false };
  if (input.rule.type === 'RANGE') {
    return {
      status: knownTotal < input.rule.minimum ? 'BELOW' : 'WITHIN',
      knownAlreadyAbove: false,
    };
  }
  if (knownTotal === input.rule.exact) return { status: 'EXACT', knownAlreadyAbove: false };
  return { status: knownTotal < input.rule.exact ? 'BELOW' : 'ABOVE', knownAlreadyAbove: false };
}

export type SlotState = 'RECORDED' | 'SKIPPED' | 'NOT_RECORDED';

export function deriveSlotState(input: {
  linkedMealCount: number;
  explicitlySkipped: boolean;
}): SlotState {
  if (input.linkedMealCount > 0) return 'RECORDED';
  if (input.explicitlySkipped) return 'SKIPPED';
  return 'NOT_RECORDED';
}
