import { describe, expect, it } from 'vitest';

import type { StoredTransaction } from '#features/transactions';

import { METRIC_LABELS, computeKpi } from './kpi-computation';

const tx = (amount: number, date: string): StoredTransaction =>
  ({ id: `tx-${date}-${amount}`, amount, date, description: 'test', categoryId: undefined }) as StoredTransaction;

describe('computeKpi', () => {
  const range = { from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) };
  // Previous range: Dec 2 – Dec 31 (same length)

  const transactions = [
    // Current period (Jan)
    tx(5000, '2026-01-10'),
    tx(-800, '2026-01-15'),
    // Previous period (Dec)
    tx(4000, '2025-12-10'),
    tx(-600, '2025-12-15'),
  ];

  it('returns correct label from METRIC_LABELS', () => {
    const kpi = computeKpi(transactions, range, 'income');
    expect(kpi.label).toBe(METRIC_LABELS.income);
  });

  it('formats value with Polish locale and zł suffix', () => {
    const kpi = computeKpi(transactions, range, 'income');
    // 5000 formatted
    expect(kpi.value).toContain('zł');
    expect(kpi.value).toContain('5');
  });

  it('computes positive delta when current > previous', () => {
    const kpi = computeKpi(transactions, range, 'income');
    // Current income: 5000, Previous income: 4000 → +25.0%
    expect(kpi.delta).toBe('+25,0%');
  });

  it('computes trend as "up" when current > previous', () => {
    const kpi = computeKpi(transactions, range, 'income');
    expect(kpi.trend).toBe('up');
  });

  it('sets invertColor=true for expenses metric', () => {
    const kpi = computeKpi(transactions, range, 'expenses');
    expect(kpi.invertColor).toBe(true);
  });

  it('sets invertColor=false for non-expense metrics', () => {
    const kpi = computeKpi(transactions, range, 'income');
    expect(kpi.invertColor).toBe(false);
  });

  it('returns neutral trend when no transactions exist', () => {
    const kpi = computeKpi([], range, 'income');
    expect(kpi.trend).toBe('neutral');
    expect(kpi.delta).toBe('0,0%');
  });
});
