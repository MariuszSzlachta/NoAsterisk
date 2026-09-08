import { describe, expect, it } from 'vitest';

import { isImportHistoryRecord } from '#features/csv-import/model/history/is-import-history-record';

const VALID_RECORD = {
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount: 12,
  duplicateCount: 2,
  rejectedCount: 1,
};

describe('isImportHistoryRecord', () => {
  it('accepts a valid record', () => {
    expect(isImportHistoryRecord(VALID_RECORD)).toBe(true);
  });

  it.each([
    ['missing batch id', { ...VALID_RECORD, batchId: '' }],
    ['missing file name', { ...VALID_RECORD, fileName: ' ' }],
    [
      'invalid completion timestamp',
      { ...VALID_RECORD, completedAt: 'not-a-date' },
    ],
    ['negative accepted count', { ...VALID_RECORD, acceptedCount: -1 }],
    ['fractional duplicate count', { ...VALID_RECORD, duplicateCount: 1.5 }],
    [
      'infinite rejected count',
      { ...VALID_RECORD, rejectedCount: Number.POSITIVE_INFINITY },
    ],
    ['non-object payload', null],
  ])('rejects %s', (_label, value) => {
    expect(isImportHistoryRecord(value)).toBe(false);
  });
});
