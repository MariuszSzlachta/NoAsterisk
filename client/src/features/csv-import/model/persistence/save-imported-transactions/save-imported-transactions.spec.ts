import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StoredTransaction } from '#model/transaction/types';
import { saveImportedTransactions } from '#features/csv-import/model/persistence/save-imported-transactions';
import { SHA_256_HEX_LENGTH } from '#shared/adapters/persistence/crypto/constants';

const VALID_CONTENT_HASH = 'a'.repeat(SHA_256_HEX_LENGTH);

const putManyIfAbsent = vi.fn();

vi.mock('#shared/adapters/persistence/session', () => ({
  encryptedPersistence: {
    repository: (
      collection: string,
      validator: (value: unknown) => value is StoredTransaction,
      getId: (record: StoredTransaction) => string,
    ) => {
      expect(collection).toBe('transactions');
      expect(validator(transaction)).toBe(true);
      expect(getId(transaction)).toBe(transaction.id);
      return { putManyIfAbsent };
    },
  },
}));

const transaction: StoredTransaction = {
  id: 'tx-1',
  date: '2026-01-15',
  description: 'Masked title',
  amount: -100,
  currency: 'PLN',
  contentHash: VALID_CONTENT_HASH,
  batchId: 'batch-1',
  importedAt: '2026-01-15T12:00:00.000Z',
};

describe('saveImportedTransactions', () => {
  beforeEach(() => {
    putManyIfAbsent.mockReset();
  });

  it('writes through the encrypted repository using contentHash as deduplication key', async () => {
    putManyIfAbsent.mockImplementation(
      (
        records: ReadonlyArray<StoredTransaction>,
        getDuplicateKey: (record: StoredTransaction) => string,
      ) => {
        expect(getDuplicateKey(transaction)).toBe(VALID_CONTENT_HASH);
        return Promise.resolve({ written: records, duplicatesSkipped: 0 });
      },
    );

    await expect(saveImportedTransactions([transaction])).resolves.toEqual({
      written: [transaction],
      duplicatesSkipped: 0,
    });
    expect(putManyIfAbsent).toHaveBeenCalledWith(
      [transaction],
      expect.any(Function),
    );
  });

  it('rejects invalid records before invoking persistence', async () => {
    const invalid = { ...transaction, amount: Number.NaN };

    await expect(
      saveImportedTransactions([invalid]),
    ).rejects.toThrow('failed validation');
    expect(putManyIfAbsent).not.toHaveBeenCalled();
  });

  it('rejects raw CSV fields before invoking persistence', async () => {
    const invalid = { ...transaction, source: 'Original PII' };

    await expect(saveImportedTransactions([invalid])).rejects.toThrow('failed validation');
    expect(putManyIfAbsent).not.toHaveBeenCalled();
  });

  it('rejects blank required fields before invoking persistence', async () => {
    const invalid = { ...transaction, description: '   ' };

    await expect(saveImportedTransactions([invalid])).rejects.toThrow('failed validation');
    expect(putManyIfAbsent).not.toHaveBeenCalled();
  });
});
