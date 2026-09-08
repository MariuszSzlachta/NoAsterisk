import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { saveImportHistoryRecord } from '#features/csv-import/model/persistence/save-import-history-record';

const putMock = vi.fn<() => Promise<void>>();

vi.mock('#shared/adapters/persistence/session', () => ({
  encryptedPersistence: {
    repository: () => ({ put: putMock }),
  },
}));

const VALID_RECORD: ImportHistoryRecord = {
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount: 1,
  duplicateCount: 0,
  rejectedCount: 0,
};

describe('saveImportHistoryRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes a valid record through encrypted persistence', async () => {
    putMock.mockResolvedValue(undefined);

    await expect(
      saveImportHistoryRecord(VALID_RECORD),
    ).resolves.toBeUndefined();
    expect(putMock).toHaveBeenCalledWith(VALID_RECORD);
  });

  it('rejects malformed runtime input before persistence', async () => {
    await expect(
      saveImportHistoryRecord({ ...VALID_RECORD, acceptedCount: -1 }),
    ).rejects.toThrow('failed validation');
    expect(putMock).not.toHaveBeenCalled();
  });
});
