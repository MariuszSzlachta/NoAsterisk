import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import { mapImportRowToStoredTransaction } from '#features/csv-import/model/persistence/map-import-row-to-stored-transaction';
import { SHA_256_HEX_LENGTH } from '#shared/adapters/persistence/crypto/constants';

const VALID_CONTENT_HASH = 'a'.repeat(SHA_256_HEX_LENGTH);

const buildRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: 'row-1',
  date: '2026-01-15',
  title: 'Masked title',
  amount: -100,
  currency: 'EUR',
  category: 'cat-groceries',
  source: 'Original source PII',
  recipient: 'Original recipient PII',
  status: 'ok',
  ...overrides,
});

describe('mapImportRowToStoredTransaction', () => {
  it('maps only accepted post-review fields to StoredTransaction', () => {
    const result = mapImportRowToStoredTransaction(buildRow(), {
      id: 'row-1',
      description: 'Masked title',
      contentHash: VALID_CONTENT_HASH,
      batchId: 'batch-1',
      importedAt: '2026-01-15T12:00:00.000Z',
    });

    expect(result).toEqual({
      id: 'row-1',
      date: '2026-01-15',
      description: 'Masked title',
      amount: -100,
      currency: 'EUR',
      categoryId: 'cat-groceries',
      contentHash: VALID_CONTENT_HASH,
      batchId: 'batch-1',
      importedAt: '2026-01-15T12:00:00.000Z',
    });
    expect(result).not.toHaveProperty('source');
    expect(result).not.toHaveProperty('recipient');
    expect(result).not.toHaveProperty('originalTitle');
  });

  it('preserves signed amount and optional category absence', () => {
    const result = mapImportRowToStoredTransaction(
      buildRow({ amount: 8500, category: undefined }),
      {
        id: 'row-1',
        description: 'Salary',
        contentHash: VALID_CONTENT_HASH,
        batchId: 'batch-1',
        importedAt: '2026-01-15T12:00:00.000Z',
      },
    );

    expect(result.amount).toBe(8500);
    expect(result.categoryId).toBeUndefined();
  });

  it('rejects invalid accepted data before a repository write', () => {
    expect(() =>
      mapImportRowToStoredTransaction(buildRow({ amount: Number.NaN }), {
        id: 'row-1',
        description: 'Masked title',
        contentHash: VALID_CONTENT_HASH,
        batchId: 'batch-1',
        importedAt: '2026-01-15T12:00:00.000Z',
      }),
    ).toThrow('not valid for local persistence');
  });

  it('rejects whitespace-only persistence metadata', () => {
    expect(() =>
      mapImportRowToStoredTransaction(buildRow(), {
        id: 'row-1',
        description: '   ',
        contentHash: VALID_CONTENT_HASH,
        batchId: 'batch-1',
        importedAt: '2026-01-15T12:00:00.000Z',
      }),
    ).toThrow('not valid for local persistence');
  });

  it('rejects a non-SHA-256 content hash', () => {
    expect(() =>
      mapImportRowToStoredTransaction(buildRow(), {
        id: 'row-1',
        description: 'Masked title',
        contentHash: 'not-a-sha256-hash',
        batchId: 'batch-1',
        importedAt: '2026-01-15T12:00:00.000Z',
      }),
    ).toThrow('not valid for local persistence');
  });
});
