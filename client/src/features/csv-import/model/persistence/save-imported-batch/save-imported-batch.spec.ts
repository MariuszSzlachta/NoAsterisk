import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveImportedBatch } from '#features/csv-import/model/persistence/save-imported-batch';
import type { StoredTransaction } from '#model/transaction/types';

const putManyIfAbsentWithRelatedMock = vi.hoisted(() => vi.fn());

vi.mock('#shared/adapters/persistence/session', () => ({
  encryptedPersistence: {
    putManyIfAbsentWithRelated: putManyIfAbsentWithRelatedMock,
  },
}));

const RECORD: StoredTransaction = {
  id: 'transaction-1',
  date: '2026-09-01',
  description: 'Safe title',
  amount: -10,
  currency: 'PLN',
  contentHash: 'a'.repeat(64),
  batchId: 'batch-1',
  importedAt: '2026-09-08T10:00:00.000Z',
};

describe('saveImportedBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    putManyIfAbsentWithRelatedMock.mockImplementation(
      async (_primaryWrite, createRelatedWrite) => {
        const result = { written: [RECORD], duplicatesSkipped: 2 };
        const relatedWrite = createRelatedWrite(result);
        expect(relatedWrite.records).toEqual([
          expect.objectContaining({
            batchId: 'batch-1',
            acceptedCount: 1,
            duplicateCount: 2,
            rejectedCount: 3,
          }),
        ]);
        return result;
      },
    );
  });

  it('returns the history summary produced by the same atomic write', async () => {
    const result = await saveImportedBatch([RECORD], {
      batchId: 'batch-1',
      fileName: 'statement.csv',
      completedAt: '2026-09-08T10:00:00.000Z',
      rejectedCount: 3,
    });

    expect(result).toEqual({
      written: [RECORD],
      duplicatesSkipped: 2,
      historyRecord: {
        batchId: 'batch-1',
        fileName: 'statement.csv',
        completedAt: '2026-09-08T10:00:00.000Z',
        acceptedCount: 1,
        duplicateCount: 2,
        rejectedCount: 3,
      },
    });
    expect(putManyIfAbsentWithRelatedMock).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed imported records before opening persistence', async () => {
    await expect(
      saveImportedBatch([{ ...RECORD, description: '' }], {
        batchId: 'batch-1',
        fileName: 'statement.csv',
        completedAt: '2026-09-08T10:00:00.000Z',
        rejectedCount: 0,
      }),
    ).rejects.toThrow('Imported transactions failed validation');

    expect(putManyIfAbsentWithRelatedMock).not.toHaveBeenCalled();
  });
});
