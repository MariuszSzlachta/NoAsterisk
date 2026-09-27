import { describe, expect, it } from 'vitest';

import { autoCategorize } from './auto-categorize';
import type { RuleRecord, UncategorizedTransaction } from './types';

const buildRule = (overrides: Partial<RuleRecord> = {}): RuleRecord => ({
  id: 'rule-1',
  keyword: 'market',
  matcherType: 'Contains',
  categoryId: 'cat-groceries',
  priority: 1,
  createdAt: '2026-09-27T00:00:00.000Z',
  ...overrides,
});

const buildTransaction = (
  overrides: Partial<UncategorizedTransaction> = {},
): UncategorizedTransaction => ({
  id: 'transaction-1',
  description: 'Local Market',
  ...overrides,
});

describe('autoCategorize', () => {
  it('matches contains rules case-insensitively', () => {
    expect(autoCategorize([buildRule()], [buildTransaction()])).toEqual([
      { transactionId: 'transaction-1', categoryId: 'cat-groceries' },
    ]);
  });

  it('requires a complete match for exact rules', () => {
    expect(
      autoCategorize(
        [buildRule({ keyword: 'market', matcherType: 'Exact' })],
        [buildTransaction()],
      ),
    ).toEqual([]);
  });

  it('uses the highest-priority matching rule', () => {
    const rules = [
      buildRule({ id: 'low', categoryId: 'cat-low', priority: 1 }),
      buildRule({ id: 'high', categoryId: 'cat-high', priority: 10 }),
    ];

    expect(autoCategorize(rules, [buildTransaction()])).toEqual([
      { transactionId: 'transaction-1', categoryId: 'cat-high' },
    ]);
  });

  it('skips categorized transactions and invalid rules', () => {
    const transactions = [buildTransaction({ categoryId: 'cat-existing' })];
    const invalidRules = [buildRule({ keyword: ' ', priority: 0 })];

    expect(autoCategorize(invalidRules, transactions)).toEqual([]);
  });
});
