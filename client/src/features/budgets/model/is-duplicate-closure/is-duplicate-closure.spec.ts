import { describe, expect, it } from 'vitest';

import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';

import { isDuplicateClosure } from '#features/budgets/model/is-duplicate-closure';

const buildHistory = (overrides?: Partial<PeriodHistoryRecord>): PeriodHistoryRecord => ({
  id: 'ph-1',
  budgetId: 'budget-1',
  periodFrom: '2026-06-01',
  periodTo: '2026-06-30',
  limitAmount: 2000,
  spentAmount: 1500,
  remainingAmount: 500,
  closedAt: '2026-07-01T00:00:00.000Z',
  rollover: null,
  ...overrides,
});

describe('isDuplicateClosure', () => {
  it('returns true when matching record exists', () => {
    const record = buildHistory();
    const existing = [buildHistory()];
    expect(isDuplicateClosure(record, existing)).toBe(true);
  });

  it('returns false when budgetId differs', () => {
    const record = buildHistory({ budgetId: 'other' });
    const existing = [buildHistory()];
    expect(isDuplicateClosure(record, existing)).toBe(false);
  });

  it('returns false when periodFrom differs', () => {
    const record = buildHistory({ periodFrom: '2026-07-01' });
    const existing = [buildHistory()];
    expect(isDuplicateClosure(record, existing)).toBe(false);
  });

  it('returns false when periodTo differs', () => {
    const record = buildHistory({ periodTo: '2026-07-31' });
    const existing = [buildHistory()];
    expect(isDuplicateClosure(record, existing)).toBe(false);
  });

  it('returns false for empty history', () => {
    const record = buildHistory();
    expect(isDuplicateClosure(record, [])).toBe(false);
  });
});
