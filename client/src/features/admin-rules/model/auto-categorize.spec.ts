import { describe, expect, it } from 'vitest';

import { autoCategorize } from './auto-categorize';
import type { RuleRecord, UncategorizedTransaction } from './types';

// ─── Test Builders ───────────────────────────────────────────────

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

// ─── Tests ───────────────────────────────────────────────────────

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
