import { describe, expect, it } from 'vitest';

import { sortImportHistory } from '#features/csv-import/model/history/sort-import-history';

const createRecord = (batchId: string, completedAt: string) => ({
  batchId,
  fileName: `${batchId}.csv`,
  completedAt,
  acceptedCount: 1,
  duplicateCount: 0,
  rejectedCount: 0,
});

describe('sortImportHistory', () => {
  it('returns the newest completed import first without mutating input', () => {
    const records = [
      createRecord('older', '2026-09-07T10:00:00.000Z'),
      createRecord('newer', '2026-09-08T10:00:00.000Z'),
    ];

    expect(sortImportHistory(records).map((record) => record.batchId)).toEqual([
      'newer',
      'older',
    ]);
    expect(records[0]?.batchId).toBe('older');
  });
});
