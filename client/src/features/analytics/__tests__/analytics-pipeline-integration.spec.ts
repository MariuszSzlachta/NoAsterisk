// REVIEW [P1]: Integration test również łamie quality gate: duplicate import
// oraz unchecked buckets[0]/wyniki. Bez przejścia strict tsc/lint zielone testy
// nie są wiarygodnym dowodem jakości feature.
import { describe, expect, it } from 'vitest';

import { computeCategoryBreakdown } from '#features/analytics/model/category-breakdown';
import { computeCategoryDrilldown } from '#features/analytics/model/category-drilldown';
import { getDateRange } from '#features/analytics/model/date-range';
import { computeKpi } from '#features/analytics/model/kpi-computation';
import { computeMetricForBucket } from '#features/analytics/model/metric-computation';
import { getBuckets } from '#features/analytics/model/buckets';
import { getDateRangeAsDate } from '#features/analytics/model/date-range';
import type { StoredTransaction } from '#features/transactions';

// ─── Builder ─────────────────────────────────────────────────────

const tx = (overrides: Partial<StoredTransaction> = {}): StoredTransaction => ({
  id: 'tx-1',
  date: '2026-03-15',
  description: 'Test',
  amount: -100,
  currency: 'PLN',
  categoryId: 'cat-groceries',
  contentHash: 'hash',
  batchId: 'batch-1',
  importedAt: '2026-03-15T10:00:00Z',
  ...overrides,
});

// ─── Integration: full data pipeline ─────────────────────────────

describe('Analytics data pipeline (integration)', () => {
  const transactions: StoredTransaction[] = [
    tx({ id: 't1', amount: -150, date: '2026-03-05', categoryId: 'cat-groceries' }),
    tx({ id: 't2', amount: -80, date: '2026-03-10', categoryId: 'cat-transport' }),
    tx({ id: 't3', amount: 5000, date: '2026-03-01', categoryId: 'cat-salary' }),
    tx({ id: 't4', amount: -200, date: '2026-03-20', categoryId: 'cat-groceries' }),
    tx({ id: 't5', amount: -50, date: '2026-02-15', categoryId: 'cat-groceries' }), // prev period
  ];

  it('getDateRange → getBuckets → computeMetricForBucket produces series data', () => {
    const range = getDateRangeAsDate('1m');
    const buckets = getBuckets(range.from, range.to, 'monthly');

    expect(buckets.length).toBeGreaterThanOrEqual(1);

    const incomeForBucket = computeMetricForBucket(transactions, buckets[0], 'income', transactions);
    expect(typeof incomeForBucket).toBe('number');
  });

  it('computeKpi produces valid KPI from real transactions', () => {
    const range = getDateRangeAsDate('3m');
    const kpi = computeKpi(transactions, range, 'expenses');

    expect(kpi.label).toBeDefined();
    expect(kpi.value).toContain('zł');
    expect(['up', 'down', 'neutral']).toContain(kpi.trend);
  });

  it('computeCategoryBreakdown groups transactions correctly', () => {
    const dateRange = getDateRange('1y');
    const breakdown = computeCategoryBreakdown(transactions, dateRange, 'expenses');

    // Should have groceries and transport
    const groceries = breakdown.find((b) => b.category === 'Spożywcze');
    expect(groceries).toBeDefined();
    expect(groceries!.amount).toBeGreaterThan(0);
    expect(groceries!.percentage).toBeGreaterThan(0);
  });

  it('computeCategoryDrilldown returns trend + transactions for a category', () => {
    const dateRange = getDateRange('1y');
    const drilldown = computeCategoryDrilldown(transactions, 'Spożywcze', dateRange, 'expenses');

    expect(drilldown.trend.id).toBe('Spożywcze');
    expect(drilldown.trend.data).toHaveLength(6); // 6-month window
    expect(drilldown.transactions.length).toBeGreaterThan(0);
    expect(drilldown.transactions[0].amount).toBeGreaterThan(0); // absolute
  });

  it('end-to-end: filters → series + kpis', () => {
    const range = getDateRangeAsDate('6m');
    const buckets = getBuckets(range.from, range.to, 'monthly');

    // Build series for expenses metric
    const series = {
      id: 'Wydatki',
      data: buckets.map((bucket) => ({
        x: bucket.label,
        y: computeMetricForBucket(transactions, bucket, 'expenses', transactions),
      })),
    };

    expect(series.data.length).toBe(buckets.length);
    // At least one bucket should have expenses > 0
    const hasExpenses = series.data.some((d) => d.y > 0);
    expect(hasExpenses).toBe(true);
  });
});
