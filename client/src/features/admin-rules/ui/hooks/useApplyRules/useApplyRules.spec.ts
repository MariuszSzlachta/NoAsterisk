import { describe, expect, it } from 'vitest';

import type { AutoCategorizeResult } from '#features/admin-rules/model/types';

import { buildApplyResult, countUncategorized, groupByCategoryId } from './useApplyRules';

// ─── countUncategorized ──────────────────────────────────────────

describe('countUncategorized', () => {
  it('counts transactions without categoryId', () => {
    const transactions = [
      { categoryId: undefined },
      { categoryId: 'cat-1' },
      { categoryId: undefined },
    ];

    expect(countUncategorized(transactions)).toBe(2);
  });

  it('returns 0 when all have categories', () => {
    const transactions = [
      { categoryId: 'cat-1' },
      { categoryId: 'cat-2' },
    ];

    expect(countUncategorized(transactions)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(countUncategorized([])).toBe(0);
  });

  it('counts all when none have categories', () => {
    const transactions = [
      { categoryId: undefined },
      { categoryId: undefined },
      { categoryId: undefined },
    ];

    expect(countUncategorized(transactions)).toBe(3);
  });
});

// ─── groupByCategoryId ───────────────────────────────────────────

describe('groupByCategoryId', () => {
  it('groups transaction IDs by categoryId', () => {
    const results: AutoCategorizeResult[] = [
      { transactionId: 'tx-1', categoryId: 'cat-groceries' },
      { transactionId: 'tx-2', categoryId: 'cat-transport' },
      { transactionId: 'tx-3', categoryId: 'cat-groceries' },
    ];

    const grouped = groupByCategoryId(results);

    expect(grouped.get('cat-groceries')).toEqual(['tx-1', 'tx-3']);
    expect(grouped.get('cat-transport')).toEqual(['tx-2']);
  });

  it('returns empty map for empty input', () => {
    const grouped = groupByCategoryId([]);

    expect(grouped.size).toBe(0);
  });

  it('handles single result', () => {
    const results: AutoCategorizeResult[] = [
      { transactionId: 'tx-1', categoryId: 'cat-1' },
    ];

    const grouped = groupByCategoryId(results);

    expect(grouped.size).toBe(1);
    expect(grouped.get('cat-1')).toEqual(['tx-1']);
  });

  it('returns a ReadonlyMap (immutable output)', () => {
    const results: AutoCategorizeResult[] = [
      { transactionId: 'tx-1', categoryId: 'cat-1' },
    ];

    const grouped = groupByCategoryId(results);

    // Verify it's a Map (ReadonlyMap is just a type constraint)
    expect(grouped).toBeInstanceOf(Map);
  });
});

// ─── buildApplyResult ────────────────────────────────────────────

describe('buildApplyResult', () => {
  it('builds result with categorized and total counts', () => {
    const result = buildApplyResult(5, 10);

    expect(result).toEqual({ categorized: 5, total: 10 });
  });

  it('handles zero categorized', () => {
    const result = buildApplyResult(0, 7);

    expect(result).toEqual({ categorized: 0, total: 7 });
  });

  it('handles zero total', () => {
    const result = buildApplyResult(0, 0);

    expect(result).toEqual({ categorized: 0, total: 0 });
  });

  it('returns readonly object', () => {
    const result = buildApplyResult(3, 5);

    expect(Object.isFrozen(result)).toBe(false); // plain object, readonly is TS-only
    expect(result.categorized).toBe(3);
    expect(result.total).toBe(5);
  });
});
