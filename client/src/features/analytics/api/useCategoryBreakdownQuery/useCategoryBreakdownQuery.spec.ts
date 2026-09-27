import { describe, expect, it, vi } from 'vitest';

import { useCategoryBreakdownQuery } from './useCategoryBreakdownQuery';

const mocks = vi.hoisted(() => ({
  compute: vi.fn(() => [{ category: 'Food', amount: 10, percentage: 100 }]),
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
vi.mock('#features/analytics/model/category-breakdown', () => ({
  computeCategoryBreakdown: mocks.compute,
}));

describe('useCategoryBreakdownQuery', () => {
  it('computes loaded breakdown data from the transaction store and filters', () => {
    const result = useCategoryBreakdownQuery({
      metric: 'expenses',
      period: '1m',
      granularity: 'monthly',
    });

    expect(mocks.compute).toHaveBeenCalledWith(
      mocks.transactions,
      mocks.dateRange,
      'expenses',
    );
    expect(result).toEqual({
      status: 'loaded',
      data: mocks.compute.mock.results[0]?.value,
    });
  });
});
