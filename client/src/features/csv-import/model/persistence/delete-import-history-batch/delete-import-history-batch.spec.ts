import { describe, expect, it, vi } from 'vitest';

import { deleteImportHistoryBatch } from '#features/csv-import/model/persistence/delete-import-history-batch';

const deleteMatchingRecordsMock = vi.hoisted(() =>
  vi.fn<() => Promise<void>>(),
);

vi.mock('#shared/adapters/persistence/session', () => ({
  encryptedPersistence: { deleteMatchingRecords: deleteMatchingRecordsMock },
}));

describe('deleteImportHistoryBatch', () => {
  it('delegates batch deletion to the encrypted atomic persistence operation', async () => {
    deleteMatchingRecordsMock.mockResolvedValue(undefined);

    await deleteImportHistoryBatch('batch-1');

    expect(deleteMatchingRecordsMock).toHaveBeenCalledTimes(1);
    expect(deleteMatchingRecordsMock.mock.calls[0]?.[0]).toHaveLength(2);
  });
});
