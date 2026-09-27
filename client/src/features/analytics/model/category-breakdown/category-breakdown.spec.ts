import { describe, expect, it } from 'vitest';

import type { StoredTransaction } from '#model/transaction/types';

import { computeCategoryBreakdown } from './category-breakdown';

const tx = (amount: number, date: string, categoryId?: string): StoredTransaction =>
  ({ id: `tx-${date}-${amount}`, amount, date, description: 'test', categoryId }) satisfies StoredTransaction;

const dateRange = { from: '2026-01-01', to: '2026-01-31' };

describe('computeCategoryBreakdown', () => {
  it('groups expenses by categoryId with absolute amounts', () => {
    const transactions = [
      tx(-100, '2026-01-05', 'cat-groceries'),
      tx(-200, '2026-01-10', 'cat-groceries'),
      tx(-50, '2026-01-15', 'cat-transport'),
    ];

    const result = computeCategoryBreakdown(transactions, dateRange, 'expenses');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ categoryId: 'cat-groceries', category: 'Spożywcze', amount: 300 });
    expect(result[1]).toMatchObject({ categoryId: 'cat-transport', category: 'Transport', amount: 50 });
  });

  it('groups income by categoryId', () => {
    const transactions = [
      tx(8000, '2026-01-01', 'cat-salary'),
      tx(500, '2026-01-15', 'cat-other'),
    ];

    const result = computeCategoryBreakdown(transactions, dateRange, 'income');

    expect(result[0]).toMatchObject({ categoryId: 'cat-salary', category: 'Wynagrodzenie', amount: 8000 });
    expect(result[1]).toMatchObject({ categoryId: 'cat-other', category: 'Inne', amount: 500 });
  });

  it('calculates percentages (rounded)', () => {
    const transactions = [
      tx(-750, '2026-01-05', 'cat-groceries'),
      tx(-250, '2026-01-10', 'cat-transport'),
    ];

    const result = computeCategoryBreakdown(transactions, dateRange, 'expenses');

    expect(result[0].percentage).toBe(75);
    expect(result[1].percentage).toBe(25);
  });

  it('sorts by amount descending', () => {
    const transactions = [
      tx(-50, '2026-01-05', 'cat-transport'),
      tx(-500, '2026-01-10', 'cat-groceries'),
      tx(-200, '2026-01-15', 'cat-entertainment'),
    ];

    const result = computeCategoryBreakdown(transactions, dateRange, 'expenses');

    expect(result[0].categoryId).toBe('cat-groceries');
    expect(result[1].categoryId).toBe('cat-entertainment');
    expect(result[2].categoryId).toBe('cat-transport');
  });

  it('filters out transactions outside date range', () => {
    const transactions = [
      tx(-100, '2025-12-31', 'cat-groceries'), // before
      tx(-200, '2026-01-15', 'cat-groceries'), // in range
      tx(-300, '2026-02-01', 'cat-groceries'), // after
    ];

    const result = computeCategoryBreakdown(transactions, dateRange, 'expenses');

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(200);
  });

  it('returns empty array when no matching transactions', () => {
    const transactions = [tx(1000, '2026-01-10', 'cat-salary')];
    const result = computeCategoryBreakdown(transactions, dateRange, 'expenses');
    expect(result).toEqual([]);
  });

  it('labels uncategorized transactions', () => {
    const transactions = [tx(-100, '2026-01-10', undefined)];
    const result = computeCategoryBreakdown(transactions, dateRange, 'expenses');
    expect(result[0].category).toBe('Bez kategorii');
    expect(result[0].categoryId).toBe('__uncategorized__');
  });
});
