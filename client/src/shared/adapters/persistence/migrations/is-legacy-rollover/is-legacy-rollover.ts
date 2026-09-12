import type { RolloverRecord } from '#features/budgets/model/types/rollover-record';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

export const isLegacyRollover = (
  value: unknown,
): value is RolloverRecord | null => {
  if (value === null) {
    return true;
  }
  return (
    isRecord(value) &&
    recordGuards.hasFiniteNumber(value, 'amount') &&
    (value.targetType === 'same_budget' ||
      value.targetType === 'savings_budget') &&
    recordGuards.hasString(value, 'targetBudgetId')
  );
};
