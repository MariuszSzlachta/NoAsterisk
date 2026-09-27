import { describe, expect, it } from 'vitest';

import { isStoredTransaction } from './is-stored-transaction';

const validTransaction = {
  id: 'transaction-1',
  date: '2026-09-27',
  description: 'Local Market',
  amount: -42.5,
  currency: 'PLN',
  contentHash: 'hash-1',
  batchId: 'batch-1',
  importedAt: '2026-09-27T00:00:00.000Z',
};

describe('isStoredTransaction', () => {
  it('accepts required fields and optional string fields', () => {
    expect(
      isStoredTransaction({
        ...validTransaction,
        categoryId: 'cat-1',
        accountName: 'Main account',
        budgetId: 'budget-1',
      }),
    ).toBe(true);
  });

  it.each([
    null,
    { ...validTransaction, id: 1 },
    { ...validTransaction, amount: '42.5' },
    { ...validTransaction, categoryId: 1 },
    { ...validTransaction, importedAt: undefined },
  ])('rejects an invalid stored transaction: %o', (value) => {
    expect(isStoredTransaction(value)).toBe(false);
  });
});
