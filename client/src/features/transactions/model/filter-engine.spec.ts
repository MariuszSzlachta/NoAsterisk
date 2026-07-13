import { describe, expect, it } from 'vitest';

import {
  computeStats,
  filterTransactions,
  paginateTransactions,
  sortTransactions,
} from './filter-engine';
import type { TransactionViewModel } from './types';

// ─── Test Data Builder ───────────────────────────────────────────

const DEFAULTS: TransactionViewModel = {
  id: 'tx-1',
  date: '2026-06-15',
  dateFormatted: '15.06.2026',
  merchant: 'Biedronka',
  description: 'Zakupy spożywcze',
  amount: -87.43,
  currency: 'PLN',
  type: 'expense',
  categoryId: 'cat-groceries',
  categoryLabel: 'Spożywcze',
  categoryColor: '#4ade80',
  accountName: 'mBank',
};

const buildTransaction = (
  overrides?: Partial<TransactionViewModel>,
): TransactionViewModel => ({
  ...DEFAULTS,
  ...overrides,
});

const SAMPLE_ROWS: ReadonlyArray<TransactionViewModel> = [
  buildTransaction({ id: 'tx-1', date: '2026-06-01', merchant: 'Biedronka', amount: -50, type: 'expense', categoryId: 'cat-groceries' }),
  buildTransaction({ id: 'tx-2', date: '2026-06-10', merchant: 'Lidl', amount: -120, type: 'expense', categoryId: 'cat-groceries', description: 'artykuły domowe' }),
  buildTransaction({ id: 'tx-3', date: '2026-06-15', merchant: 'Pracodawca', amount: 8500, type: 'income', categoryId: 'cat-salary', description: 'Wynagrodzenie czerwiec' }),
  buildTransaction({ id: 'tx-4', date: '2026-06-20', merchant: 'Netflix', amount: -49.99, type: 'expense', categoryId: undefined, description: 'Subskrypcja' }),
  buildTransaction({ id: 'tx-5', date: '2026-07-01', merchant: 'Żabka', amount: -12.5, type: 'expense', categoryId: 'cat-groceries' }),
];

// ─── filterTransactions ──────────────────────────────────────────

describe('filterTransactions', () => {
  it('returns all rows when no filters applied', () => {
    const result = filterTransactions(SAMPLE_ROWS, {});
    expect(result).toHaveLength(5);
  });

  it('filters by type income', () => {
    const result = filterTransactions(SAMPLE_ROWS, { type: 'income' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tx-3');
  });

  it('filters by type expense', () => {
    const result = filterTransactions(SAMPLE_ROWS, { type: 'expense' });
    expect(result).toHaveLength(4);
  });

  it('filters by categoryId', () => {
    const result = filterTransactions(SAMPLE_ROWS, { categoryId: 'cat-groceries' });
    expect(result).toHaveLength(3);
  });

  it('filters by dateFrom (inclusive)', () => {
    const result = filterTransactions(SAMPLE_ROWS, { dateFrom: '2026-06-15' });
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id)).toEqual(['tx-3', 'tx-4', 'tx-5']);
  });

  it('filters by dateTo (inclusive)', () => {
    const result = filterTransactions(SAMPLE_ROWS, { dateTo: '2026-06-10' });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['tx-1', 'tx-2']);
  });

  it('filters by date range', () => {
    const result = filterTransactions(SAMPLE_ROWS, {
      dateFrom: '2026-06-10',
      dateTo: '2026-06-20',
    });
    expect(result).toHaveLength(3);
  });

  it('filters by search (case-insensitive, matches merchant)', () => {
    const result = filterTransactions(SAMPLE_ROWS, { search: 'biedronka' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tx-1');
  });

  it('filters by search (matches description)', () => {
    const result = filterTransactions(SAMPLE_ROWS, { search: 'artykuły' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tx-2');
  });

  it('combines multiple filters (type + date range)', () => {
    const result = filterTransactions(SAMPLE_ROWS, {
      type: 'expense',
      dateFrom: '2026-06-10',
      dateTo: '2026-06-30',
    });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['tx-2', 'tx-4']);
  });

  it('returns empty when no matches', () => {
    const result = filterTransactions(SAMPLE_ROWS, { search: 'nonexistent' });
    expect(result).toHaveLength(0);
  });

  it('handles empty input array', () => {
    const result = filterTransactions([], { type: 'income' });
    expect(result).toHaveLength(0);
  });
});

// ─── sortTransactions ────────────────────────────────────────────

describe('sortTransactions', () => {
  it('sorts by date ascending', () => {
    const result = sortTransactions(SAMPLE_ROWS, { field: 'date', direction: 'asc' });
    expect(result[0].id).toBe('tx-1');
    expect(result[4].id).toBe('tx-5');
  });

  it('sorts by date descending', () => {
    const result = sortTransactions(SAMPLE_ROWS, { field: 'date', direction: 'desc' });
    expect(result[0].id).toBe('tx-5');
    expect(result[4].id).toBe('tx-1');
  });

  it('sorts by amount ascending', () => {
    const result = sortTransactions(SAMPLE_ROWS, { field: 'amount', direction: 'asc' });
    expect(result[0].id).toBe('tx-2'); // -120
    expect(result[4].id).toBe('tx-3'); // 8500
  });

  it('sorts by amount descending', () => {
    const result = sortTransactions(SAMPLE_ROWS, { field: 'amount', direction: 'desc' });
    expect(result[0].id).toBe('tx-3'); // 8500
    expect(result[4].id).toBe('tx-2'); // -120
  });

  it('sorts by merchant ascending (locale-aware)', () => {
    const result = sortTransactions(SAMPLE_ROWS, { field: 'merchant', direction: 'asc' });
    expect(result[0].merchant).toBe('Biedronka');
  });

  it('sorts by merchant descending', () => {
    const result = sortTransactions(SAMPLE_ROWS, { field: 'merchant', direction: 'desc' });
    expect(result[0].merchant).toBe('Żabka');
  });

  it('does not mutate original array', () => {
    const original = [...SAMPLE_ROWS];
    sortTransactions(SAMPLE_ROWS, { field: 'date', direction: 'desc' });
    expect(SAMPLE_ROWS).toEqual(original);
  });
});

// ─── paginateTransactions ────────────────────────────────────────

describe('paginateTransactions', () => {
  it('returns first page with correct metadata', () => {
    const result = paginateTransactions(SAMPLE_ROWS, 1, 2, 10);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('tx-1');
    expect(result.items[1].id).toBe('tx-2');
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.totalFiltered).toBe(5);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(3);
  });

  it('returns last page with remaining items', () => {
    const result = paginateTransactions(SAMPLE_ROWS, 3, 2, 10);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('tx-5');
    expect(result.page).toBe(3);
  });

  it('clamps page to maximum when exceeding totalPages', () => {
    const result = paginateTransactions(SAMPLE_ROWS, 99, 2, 10);
    expect(result.page).toBe(3);
    expect(result.items).toHaveLength(1);
  });

  it('clamps page to 1 when below minimum', () => {
    const result = paginateTransactions(SAMPLE_ROWS, 0, 2, 10);
    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(2);
  });

  it('returns all items when pageSize >= total', () => {
    const result = paginateTransactions(SAMPLE_ROWS, 1, 100, 5);
    expect(result.items).toHaveLength(5);
    expect(result.totalPages).toBe(1);
  });

  it('handles empty array', () => {
    const result = paginateTransactions([], 1, 20, 0);
    expect(result.items).toHaveLength(0);
    expect(result.totalFiltered).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });
});

// ─── computeStats ────────────────────────────────────────────────

describe('computeStats', () => {
  it('computes total count', () => {
    const stats = computeStats(SAMPLE_ROWS);
    expect(stats.totalCount).toBe(5);
  });

  it('computes uncategorized count', () => {
    const stats = computeStats(SAMPLE_ROWS);
    expect(stats.uncategorizedCount).toBe(1); // tx-4 (Netflix)
  });

  it('computes expense sum (negative amounts)', () => {
    const stats = computeStats(SAMPLE_ROWS);
    // -50 + -120 + -49.99 + -12.5 = -232.49
    expect(stats.expenseSum).toBeCloseTo(-232.49);
  });

  it('computes income sum', () => {
    const stats = computeStats(SAMPLE_ROWS);
    expect(stats.incomeSum).toBe(8500);
  });

  it('handles empty array', () => {
    const stats = computeStats([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.uncategorizedCount).toBe(0);
    expect(stats.expenseSum).toBe(0);
    expect(stats.incomeSum).toBe(0);
  });

  it('handles all uncategorized', () => {
    const rows = [
      buildTransaction({ id: 'a', categoryId: undefined }),
      buildTransaction({ id: 'b', categoryId: undefined }),
    ];
    const stats = computeStats(rows);
    expect(stats.uncategorizedCount).toBe(2);
  });
});
