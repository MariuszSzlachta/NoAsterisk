import { describe, expect, it } from 'vitest';

import type { StoredTransaction } from '#entities/transaction/types';

import { METRIC_LABEL_KEYS, computeKpi } from './kpi-computation';

const tx = (amount: number, date: string): StoredTransaction =>
  ({ id: `tx-${date}-${amount}`, amount, date, description: 'test', categoryId: undefined }) satisfies StoredTransaction;

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

  it('returns i18n key as label', () => {
    const kpi = computeKpi(transactions, range, 'income');
    expect(kpi.label).toBe(METRIC_LABEL_KEYS.income);
    expect(kpi.label).toBe('analytics.kpi.income');
  });

  it('formats value with Polish locale and zł suffix', () => {
    const kpi = computeKpi(transactions, range, 'income');
    // 5000 formatted
    expect(kpi.value).toContain('zł');
    expect(kpi.value).toContain('5');
  });

  it('uses the income tone for income values', () => {
    expect(computeKpi(transactions, range, 'income').valueTone).toBe('income');
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

  it('hides comparison when the previous period has no transactions', () => {
    const kpi = computeKpi([], range, 'income');
    expect(kpi.trend).toBe('neutral');
    expect(kpi.delta).toBeUndefined();
  });

  it('keeps an infinite delta when the previous period exists but its metric is zero', () => {
    const kpi = computeKpi(
      [tx(5000, '2026-01-10'), tx(-600, '2025-12-15')],
      range,
      'income',
    );

    expect(kpi.delta).toBe('+∞');
  });

  it('uses formatSignedAmount for balance metric (preserves sign)', () => {
    const balanceKpi = computeKpi(transactions, range, 'balance');
    expect(balanceKpi.label).toBe('analytics.kpi.balance');
    expect(balanceKpi.value).toContain('zł');
    expect(balanceKpi.valueTone).toBe('income');
  });

  it('uses formatAbsoluteAmount for expenses metric (absolute value)', () => {
    const kpi = computeKpi(transactions, range, 'expenses');
    // expenses value should not have negative sign
    expect(kpi.value).not.toMatch(/^-/);
    expect(kpi.value).toContain('zł');
    expect(kpi.valueTone).toBe('expense');
  });

  it('uses the expense tone for a negative savings value without comparison data', () => {
    const kpi = computeKpi([tx(-800, '2026-01-15')], range, 'savings');

    expect(kpi.valueTone).toBe('expense');
    expect(kpi.delta).toBeUndefined();
  });
});
