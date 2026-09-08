import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { isRolloverRecord } from '#features/budgets/model/is-rollover-record';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

export const isPeriodHistoryRecord = (value: unknown): value is PeriodHistoryRecord =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'budgetId') &&
  recordGuards.hasString(value, 'periodFrom') &&
  recordGuards.hasString(value, 'periodTo') &&
  recordGuards.hasFiniteNumber(value, 'limitAmount') &&
  recordGuards.hasFiniteNumber(value, 'spentAmount') &&
  recordGuards.hasFiniteNumber(value, 'remainingAmount') &&
  recordGuards.hasString(value, 'closedAt') &&
  (value.rollover === null || isRolloverRecord(value.rollover));
