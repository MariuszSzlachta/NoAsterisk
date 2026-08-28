import { beforeEach, describe, expect, it } from 'vitest';

import { usePeriodHistoryStore } from './usePeriodHistoryStore';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';

// ─── Helpers ─────────────────────────────────────────────────────

const buildHistoryRecord = (overrides?: Partial<PeriodHistoryRecord>): PeriodHistoryRecord => ({
  id: 'ph-1',
  budgetId: 'budget-1',
  periodFrom: '2026-07-01',
  periodTo: '2026-07-31',
  limitAmount: 2000,
  spentAmount: 1500,
  remainingAmount: 500,
  closedAt: '2026-08-01T10:00:00.000Z',
  rollover: { amount: 500, targetType: 'same_budget', targetBudgetId: 'budget-1' },
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────

describe('usePeriodHistoryStore', () => {
  beforeEach(() => {
    usePeriodHistoryStore.setState({ history: [] });
  });

  it('adds a closed period record', () => {
    const record = buildHistoryRecord();

    const result = usePeriodHistoryStore.getState().addClosedPeriod(record);

    expect(result).toBe(true);
    expect(usePeriodHistoryStore.getState().history).toHaveLength(1);
    expect(usePeriodHistoryStore.getState().history[0]).toEqual(record);
  });

  it('appends multiple records for different periods', () => {
    const record1 = buildHistoryRecord({ id: 'ph-1', periodFrom: '2026-07-01', periodTo: '2026-07-31' });
    const record2 = buildHistoryRecord({ id: 'ph-2', periodFrom: '2026-08-01', periodTo: '2026-08-31' });

    usePeriodHistoryStore.getState().addClosedPeriod(record1);
    usePeriodHistoryStore.getState().addClosedPeriod(record2);

    expect(usePeriodHistoryStore.getState().history).toHaveLength(2);
  });

  it('rejects duplicate closure — same budgetId, periodFrom, periodTo', () => {
    const record1 = buildHistoryRecord({ id: 'ph-1' });
    const record2 = buildHistoryRecord({ id: 'ph-2' }); // different id, same period

    usePeriodHistoryStore.getState().addClosedPeriod(record1);
    const result = usePeriodHistoryStore.getState().addClosedPeriod(record2);

    expect(result).toBe(false);
    expect(usePeriodHistoryStore.getState().history).toHaveLength(1);
  });

  it('allows same period for different budgets', () => {
    const record1 = buildHistoryRecord({ id: 'ph-1', budgetId: 'budget-1' });
    const record2 = buildHistoryRecord({ id: 'ph-2', budgetId: 'budget-2' });

    usePeriodHistoryStore.getState().addClosedPeriod(record1);
    usePeriodHistoryStore.getState().addClosedPeriod(record2);

    expect(usePeriodHistoryStore.getState().history).toHaveLength(2);
  });

  it('preserves existing history on new append', () => {
    const existing = buildHistoryRecord({ id: 'ph-existing', periodFrom: '2026-06-01', periodTo: '2026-06-30' });
    usePeriodHistoryStore.setState({ history: [existing] });

    const newRecord = buildHistoryRecord({ id: 'ph-new', periodFrom: '2026-07-01', periodTo: '2026-07-31' });
    usePeriodHistoryStore.getState().addClosedPeriod(newRecord);

    expect(usePeriodHistoryStore.getState().history).toHaveLength(2);
    expect(usePeriodHistoryStore.getState().history[0]).toEqual(existing);
  });
});
