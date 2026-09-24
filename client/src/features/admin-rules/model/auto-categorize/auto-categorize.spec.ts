import { describe, expect, it } from 'vitest';

import { autoCategorize } from '#features/admin-rules/model/auto-categorize/auto-categorize';
import { filterUncategorized } from '#features/admin-rules/model/auto-categorize/filter-uncategorized';
import { findMatchingRule } from '#features/admin-rules/model/auto-categorize/find-matching-rule';
import { matchesRule } from '#features/admin-rules/model/auto-categorize/matches-rule';
import { sortRulesByPriority } from '#features/admin-rules/model/auto-categorize/sort-rules-by-priority';
import type { RuleRecord, UncategorizedTransaction } from '#features/admin-rules/model/types';

const buildRule = (overrides: Partial<RuleRecord> = {}): RuleRecord => ({
  id: 'rule-1',
  keyword: 'BIEDRONKA',
  matcherType: 'Contains',
  categoryId: 'cat-groceries',
  priority: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const buildTransaction = (
  overrides: Partial<UncategorizedTransaction> = {},
): UncategorizedTransaction => ({
  id: 'tx-1',
  description: 'BIEDRONKA WARSZAWA',
  categoryId: undefined,
  ...overrides,
});

describe('matchesRule', () => {
  it('returns true when Contains rule matches substring', () => {
    const rule = buildRule({ matcherType: 'Contains', keyword: 'BIEDRONKA' });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(true);
  });

  it('returns false when Contains rule does not match', () => {
    const rule = buildRule({ matcherType: 'Contains', keyword: 'LIDL' });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(false);
  });

  it('returns true when Exact rule matches full string', () => {
    const rule = buildRule({ matcherType: 'Exact', keyword: 'BIEDRONKA WARSZAWA' });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(true);
  });

  it('returns false when Exact rule is only substring', () => {
    const rule = buildRule({ matcherType: 'Exact', keyword: 'BIEDRONKA' });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(false);
  });

  it('matching is case-insensitive', () => {
    const rule = buildRule({ matcherType: 'Contains', keyword: 'biedronka' });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(true);
  });

  it('returns false for invalid rule (empty keyword)', () => {
    const rule = buildRule({ keyword: '   ' });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(false);
  });

  it('returns false for invalid rule (priority below minimum)', () => {
    const rule = buildRule({ priority: 0 });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(false);
  });

  it('returns false for unknown matcher type', () => {
    const rule = buildRule({ matcherType: 'Unknown' satisfies 'Contains' });
    expect(matchesRule('BIEDRONKA WARSZAWA', rule)).toBe(false);
  });
});

describe('sortRulesByPriority', () => {
  it('sorts rules by priority descending', () => {
    const rules = [
      buildRule({ id: 'r1', priority: 1 }),
      buildRule({ id: 'r3', priority: 10 }),
      buildRule({ id: 'r2', priority: 5 }),
    ];

    const sorted = sortRulesByPriority(rules);

    expect(sorted.map((r) => r.id)).toEqual(['r3', 'r2', 'r1']);
  });

  it('does not mutate the original array', () => {
    const rules = [
      buildRule({ id: 'r1', priority: 1 }),
      buildRule({ id: 'r2', priority: 10 }),
    ];
    const original = [...rules];

    sortRulesByPriority(rules);

    expect(rules).toEqual(original);
  });

  it('returns empty array for empty input', () => {
    expect(sortRulesByPriority([])).toEqual([]);
  });
});

describe('filterUncategorized', () => {
  it('returns only transactions without categoryId', () => {
    const transactions = [
      buildTransaction({ id: 'tx-1', categoryId: undefined }),
      buildTransaction({ id: 'tx-2', categoryId: 'cat-1' }),
      buildTransaction({ id: 'tx-3', categoryId: undefined }),
    ];

    const result = filterUncategorized(transactions);

    expect(result.map((tx) => tx.id)).toEqual(['tx-1', 'tx-3']);
  });

  it('returns empty array when all are categorized', () => {
    const transactions = [
      buildTransaction({ id: 'tx-1', categoryId: 'cat-1' }),
    ];

    expect(filterUncategorized(transactions)).toEqual([]);
  });

  it('returns all transactions when none are categorized', () => {
    const transactions = [
      buildTransaction({ id: 'tx-1' }),
      buildTransaction({ id: 'tx-2' }),
    ];

    expect(filterUncategorized(transactions)).toHaveLength(2);
  });
});

describe('findMatchingRule', () => {
  it('returns the first matching rule from sorted list', () => {
    const rules = [
      buildRule({ id: 'r1', keyword: 'BIEDRONKA', priority: 10 }),
      buildRule({ id: 'r2', keyword: 'BIEDRONKA', priority: 5 }),
    ];

    const result = findMatchingRule('BIEDRONKA WARSZAWA', rules);

    expect(result?.id).toBe('r1');
  });

  it('returns undefined when no rule matches', () => {
    const rules = [buildRule({ keyword: 'LIDL' })];

    const result = findMatchingRule('BIEDRONKA WARSZAWA', rules);

    expect(result).toBeUndefined();
  });

  it('returns undefined for empty rules list', () => {
    expect(findMatchingRule('BIEDRONKA', [])).toBeUndefined();
  });
});

describe('autoCategorize', () => {
  it('returns assignment when Contains rule matches substring', () => {
    const rules = [buildRule()];
    const transactions = [buildTransaction()];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([
      { transactionId: 'tx-1', categoryId: 'cat-groceries' },
    ]);
  });

  it('returns assignment when Exact rule matches full description', () => {
    const rules = [buildRule({ matcherType: 'Exact', keyword: 'BIEDRONKA WARSZAWA' })];
    const transactions = [buildTransaction()];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([
      { transactionId: 'tx-1', categoryId: 'cat-groceries' },
    ]);
  });

  it('does not match when Exact rule is substring only', () => {
    const rules = [buildRule({ matcherType: 'Exact', keyword: 'BIEDRONKA' })];
    const transactions = [buildTransaction({ description: 'BIEDRONKA WARSZAWA' })];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([]);
  });

  it('skips transactions that already have a category', () => {
    const rules = [buildRule()];
    const transactions = [buildTransaction({ categoryId: 'cat-other' })];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([]);
  });

  it('higher priority rule wins when multiple rules match', () => {
    const rules = [
      buildRule({ id: 'rule-low', priority: 1, categoryId: 'cat-other' }),
      buildRule({ id: 'rule-high', priority: 10, categoryId: 'cat-groceries' }),
    ];
    const transactions = [buildTransaction()];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([
      { transactionId: 'tx-1', categoryId: 'cat-groceries' },
    ]);
  });

  it('matching is case-insensitive', () => {
    const rules = [buildRule({ keyword: 'biedronka' })];
    const transactions = [buildTransaction({ description: 'BIEDRONKA Warszawa' })];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([
      { transactionId: 'tx-1', categoryId: 'cat-groceries' },
    ]);
  });

  it('returns empty array when no rules provided', () => {
    const transactions = [buildTransaction()];

    const results = autoCategorize([], transactions);

    expect(results).toEqual([]);
  });

  it('returns empty array when no transactions match any rule', () => {
    const rules = [buildRule({ keyword: 'LIDL' })];
    const transactions = [buildTransaction({ description: 'BIEDRONKA WARSZAWA' })];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([]);
  });

  it('categorizes multiple transactions independently', () => {
    const rules = [
      buildRule({ id: 'rule-1', keyword: 'BIEDRONKA', categoryId: 'cat-groceries' }),
      buildRule({ id: 'rule-2', keyword: 'UBER', categoryId: 'cat-transport', priority: 2 }),
    ];
    const transactions = [
      buildTransaction({ id: 'tx-1', description: 'BIEDRONKA WARSZAWA' }),
      buildTransaction({ id: 'tx-2', description: 'UBER TRIP' }),
      buildTransaction({ id: 'tx-3', description: 'NETFLIX' }),
    ];

    const results = autoCategorize(rules, transactions);

    expect(results).toEqual([
      { transactionId: 'tx-1', categoryId: 'cat-groceries' },
      { transactionId: 'tx-2', categoryId: 'cat-transport' },
    ]);
  });
});
