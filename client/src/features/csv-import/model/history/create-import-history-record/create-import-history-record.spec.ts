import { describe, expect, it } from 'vitest';

import { createImportHistoryRecord } from '#features/csv-import/model/history/create-import-history-record';

describe('createImportHistoryRecord', () => {
  it('creates a minimal history record from the completed import summary', () => {
    expect(
      createImportHistoryRecord({
        batchId: 'batch-1',
        fileName: 'statement.csv',
        completedAt: '2026-09-08T10:00:00.000Z',
        acceptedCount: 12,
        duplicateCount: 2,
        rejectedCount: 1,
      }),
    ).toEqual({
      batchId: 'batch-1',
      fileName: 'statement.csv',
      completedAt: '2026-09-08T10:00:00.000Z',
      acceptedCount: 12,
      duplicateCount: 2,
      rejectedCount: 1,
    });
  });
});
