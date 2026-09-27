import { describe, expect, it, vi } from 'vitest';

import { useCategoryDrilldownQuery } from './useCategoryDrilldownQuery';

const mocks = vi.hoisted(() => ({
  compute: vi.fn(() => ({
    trend: { id: 'Food', data: [] },
    transactions: [],
  })),
  dateRange: { from: '2026-09-01', to: '2026-09-30' },
  transactions: [{ id: 'transaction-1' }],
}));

vi.mock('#model/transaction', () => ({
  useTransactionsStore: (
    selector: (state: { transactions: unknown[] }) => unknown,
  ) => selector({ transactions: mocks.transactions }),
}));
vi.mock('#features/analytics/model/date-range', () => ({
  getDateRange: () => mocks.dateRange,
}));
vi.mock('#features/analytics/model/category-drilldown', () => ({
  computeCategoryDrilldown: mocks.compute,
}));

describe('useCategoryDrilldownQuery', () => {
  it('computes loaded drilldown data for the selected category', () => {
    const result = useCategoryDrilldownQuery('Food', {
      metric: 'expenses',
      period: '1m',
      granularity: 'monthly',
    });

    expect(mocks.compute).toHaveBeenCalledWith(
      mocks.transactions,
      'Food',
      mocks.dateRange,
      'expenses',
    );
    expect(result.status).toBe('loaded');
    expect(result.data).toEqual(mocks.compute.mock.results[0]?.value);
  });
});
