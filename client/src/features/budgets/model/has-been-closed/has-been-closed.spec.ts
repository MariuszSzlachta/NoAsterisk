import { describe, expect, it } from 'vitest';

import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';

import { hasBeenClosed } from '#features/budgets/model/has-been-closed';

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

describe('hasBeenClosed', () => {
  it('returns true when matching period exists in history', () => {
    const from = new Date('2026-06-01');
    const to = new Date('2026-06-30');
    expect(hasBeenClosed('budget-1', from, to, [buildHistory()])).toBe(true);
  });

  it('returns false when no matching period in history', () => {
    const from = new Date('2026-07-01');
    const to = new Date('2026-07-31');
    expect(hasBeenClosed('budget-1', from, to, [buildHistory()])).toBe(false);
  });

  it('returns false when budgetId does not match', () => {
    const from = new Date('2026-06-01');
    const to = new Date('2026-06-30');
    expect(hasBeenClosed('other', from, to, [buildHistory()])).toBe(false);
  });

  it('returns false when history is undefined', () => {
    const from = new Date('2026-06-01');
    const to = new Date('2026-06-30');
    expect(hasBeenClosed('budget-1', from, to, undefined)).toBe(false);
  });

  it('returns false when history is empty', () => {
    const from = new Date('2026-06-01');
    const to = new Date('2026-06-30');
    expect(hasBeenClosed('budget-1', from, to, [])).toBe(false);
  });
});
