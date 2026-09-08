import { describe, expect, it } from 'vitest';

import type { StoredTransaction } from '#entities/transaction/types';
import { isImportedTransaction } from '#features/csv-import/model/persistence/is-imported-transaction';
import { SHA_256_HEX_LENGTH } from '#shared/adapters/persistence/crypto/constants';

const VALID_CONTENT_HASH = 'a'.repeat(SHA_256_HEX_LENGTH);

const buildTransaction = (
  overrides: Partial<StoredTransaction> = {},
): StoredTransaction => ({
  id: 'tx-1',
  date: '2026-01-15',
  description: 'Masked title',
  amount: -100,
  currency: 'PLN',
  contentHash: VALID_CONTENT_HASH,
  batchId: 'batch-1',
  importedAt: '2026-01-15T12:00:00.000Z',
  ...overrides,
});

describe('isImportedTransaction', () => {
  it('accepts the whitelisted import shape with or without a category', () => {
    expect(isImportedTransaction(buildTransaction())).toBe(true);
    expect(isImportedTransaction(buildTransaction({ categoryId: 'cat-groceries' }))).toBe(true);
  });

  it('rejects malformed values and unknown raw CSV fields', () => {
    expect(isImportedTransaction(undefined)).toBe(false);
    expect(isImportedTransaction(buildTransaction({ amount: Number.NaN }))).toBe(false);
    expect(isImportedTransaction({ ...buildTransaction(), source: 'Original PII' })).toBe(false);
  });

  it.each(['id', 'date', 'description', 'currency', 'batchId', 'importedAt'])(
    'rejects a blank %s',
    (field) => {
      expect(isImportedTransaction({ ...buildTransaction(), [field]: ' ' })).toBe(false);
    },
  );

  it('rejects blank optional categories and non-SHA-256 hashes', () => {
    expect(isImportedTransaction(buildTransaction({ categoryId: ' ' }))).toBe(false);
    expect(isImportedTransaction(buildTransaction({ contentHash: 'not-a-hash' }))).toBe(false);
  });
});
