import { describe, expect, it, vi } from 'vitest';

import { useAnalyticsQuery } from './useAnalyticsQuery';

const mocks = vi.hoisted(() => ({
  bucketMetric: vi.fn(() => 25),
  kpi: vi.fn((_: unknown, __: unknown, metric: string) => ({
    label: metric,
    value: '25 zł',
    valueTone: 'neutral',
    trend: 'neutral',
  })),
  transactions: [
    { id: 'in-range', date: '2026-09-15' },
    { id: 'out-of-range', date: '2026-08-31' },
  ],
}));

vi.mock('#model/transaction', () => ({
  useTransactionsStore: (
    selector: (state: { transactions: unknown[] }) => unknown,
  ) => selector({ transactions: mocks.transactions }),
}));
vi.mock('#features/analytics/model/date-range', () => ({
  getDateRangeAsDate: () => ({
    from: new Date('2026-09-01T12:00:00Z'),
    to: new Date('2026-09-30T12:00:00Z'),
  }),
  toLocalDateStr: (date: Date) => date.toISOString().slice(0, 10),
}));
vi.mock('#features/analytics/model/buckets', () => ({
  getBuckets: () => [
    { label: 'September', from: '2026-09-01', to: '2026-09-30' },
  ],
}));
vi.mock('#features/analytics/model/metric-computation', () => ({
  computeMetricForBucket: mocks.bucketMetric,
}));
vi.mock('#features/analytics/model/kpi-computation', () => ({
  computeKpi: mocks.kpi,
}));

describe('useAnalyticsQuery', () => {
  it('builds loaded series and KPI data for every selected metric', () => {
    const result = useAnalyticsQuery({
      metrics: ['expenses', 'income'],
      period: '1m',
      chartType: 'line',
      granularity: 'monthly',
    });

    expect(result.status).toBe('loaded');
    expect(result.data.series).toEqual([
      { id: 'expenses', data: [{ x: 'September', y: 25 }] },
      { id: 'income', data: [{ x: 'September', y: 25 }] },
    ]);
    expect(result.data.kpis).toHaveLength(2);
    expect(mocks.bucketMetric).toHaveBeenCalledWith(
      [mocks.transactions[0]],
      expect.any(Object),
      'expenses',
      mocks.transactions,
    );
  });
});
