import { describe, expect, it } from 'vitest';

import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import type { StoredTransaction } from '#features/transactions/model/types';
import { categorizeImportedTransactions } from '#features/csv-import/model/persistence/categorize-imported-transactions';

const transaction: StoredTransaction = {
  id: 'tx-1',
  date: '2026-01-15',
  description: 'Coffee shop',
  amount: -20,
  currency: 'PLN',
  contentHash: 'hash-1',
  batchId: 'batch-1',
  importedAt: '2026-01-15T12:00:00.000Z',
};

const rule: RuleRecord = {
  id: 'rule-1',
  keyword: 'coffee',
  matcherType: 'Contains',
  categoryId: 'cat-entertainment',
  priority: 1,
  createdAt: '2026-01-15T12:00:00.000Z',
};

describe('categorizeImportedTransactions', () => {
  it('applies the highest-priority matching rule to uncategorized records', () => {
    expect(categorizeImportedTransactions([transaction], [rule])[0]?.categoryId).toBe(
      'cat-entertainment',
    );
  });

  it('does not override an imported category', () => {
    const categorized = categorizeImportedTransactions(
      [{ ...transaction, categoryId: 'cat-groceries' }],
      [rule],
    );

    expect(categorized[0]?.categoryId).toBe('cat-groceries');
  });

  it('leaves records unchanged when no rule matches', () => {
    expect(categorizeImportedTransactions([transaction], [rule])).toEqual([
      { ...transaction, categoryId: 'cat-entertainment' },
    ]);
    expect(
      categorizeImportedTransactions(
        [{ ...transaction, description: 'Rent' }],
        [rule],
      ),
    ).toEqual([{ ...transaction, description: 'Rent' }]);
  });
});
