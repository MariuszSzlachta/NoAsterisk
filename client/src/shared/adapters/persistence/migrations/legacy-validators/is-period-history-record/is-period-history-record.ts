import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { isLegacyRollover } from '#shared/adapters/persistence/migrations/is-legacy-rollover';
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
  isLegacyRollover(value.rollover);
