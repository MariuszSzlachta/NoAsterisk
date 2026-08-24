import { describe, expect, it } from 'vitest';

import type { StoredTransaction } from '#features/transactions';

import { computeCategoryDrilldown } from './category-drilldown';

const tx = (id: string, amount: number, date: string, categoryId?: string): StoredTransaction =>
  ({ id, amount, date, description: `Desc ${id}`, categoryId }) as StoredTransaction;

const dateRange = { from: '2026-01-01', to: '2026-06-30' };

describe('computeCategoryDrilldown', () => {
  const transactions = [
    tx('t1', -100, '2026-01-10', 'cat-groceries'),
    tx('t2', -200, '2026-02-15', 'cat-groceries'),
    tx('t3', -50, '2026-03-20', 'cat-groceries'),
    tx('t4', -300, '2026-01-05', 'cat-transport'), // different category
    tx('t5', 5000, '2026-01-01', 'cat-salary'),    // income, not expense
  ];

  it('returns trend series with category as id', () => {
    const result = computeCategoryDrilldown(transactions, 'Spożywcze', dateRange, 'expenses');
    expect(result.trend.id).toBe('Spożywcze');
  });

  it('trend has 6 data points (6 months)', () => {
    const result = computeCategoryDrilldown(transactions, 'Spożywcze', dateRange, 'expenses');
    expect(result.trend.data).toHaveLength(6);
  });

  it('returns recent transactions sorted by date descending', () => {
    const result = computeCategoryDrilldown(transactions, 'Spożywcze', dateRange, 'expenses');
    expect(result.transactions[0].date).toBe('2026-03-20');
    expect(result.transactions[1].date).toBe('2026-02-15');
    expect(result.transactions[2].date).toBe('2026-01-10');
  });

  it('transactions have absolute amounts', () => {
    const result = computeCategoryDrilldown(transactions, 'Spożywcze', dateRange, 'expenses');
    expect(result.transactions[0].amount).toBe(50);
    expect(result.transactions[1].amount).toBe(200);
  });

  it('caps at 10 transactions', () => {
    const manyTx = Array.from({ length: 15 }, (_, i) =>
      tx(`tx-${i}`, -10, `2026-01-${String(i + 1).padStart(2, '0')}`, 'cat-groceries'),
    );
    const result = computeCategoryDrilldown(manyTx, 'Spożywcze', dateRange, 'expenses');
    expect(result.transactions).toHaveLength(10);
  });

  it('filters by metric (income only)', () => {
    const result = computeCategoryDrilldown(transactions, 'Wynagrodzenie', dateRange, 'income');
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(5000);
  });

  it('returns empty transactions when category has no matches', () => {
    const result = computeCategoryDrilldown(transactions, 'Nieistniejąca', dateRange, 'expenses');
    expect(result.transactions).toEqual([]);
  });
});
