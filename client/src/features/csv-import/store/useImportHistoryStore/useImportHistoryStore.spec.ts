import { afterEach, describe, expect, it } from 'vitest';

import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';

const RECORD: ImportHistoryRecord = {
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount: 1,
  duplicateCount: 0,
  rejectedCount: 0,
};

describe('useImportHistoryStore', () => {
  afterEach(() => {
    useImportHistoryStore.setState({ history: [] });
  });

  it('replaces an existing record with the same stable batch id', () => {
    useImportHistoryStore.getState().addRecord(RECORD);
    useImportHistoryStore
      .getState()
      .addRecord({ ...RECORD, fileName: 'updated.csv' });

    expect(useImportHistoryStore.getState().history).toEqual([
      { ...RECORD, fileName: 'updated.csv' },
    ]);
  });

  it('removes only the requested batch', () => {
    useImportHistoryStore
      .getState()
      .setHistory([
        RECORD,
        { ...RECORD, batchId: 'batch-2', fileName: 'statement.csv' },
      ]);

    useImportHistoryStore.getState().removeRecord('batch-1');

    expect(useImportHistoryStore.getState().history).toEqual([
      { ...RECORD, batchId: 'batch-2', fileName: 'statement.csv' },
    ]);
  });

  it('keeps duplicate filenames as distinct batch records', () => {
    useImportHistoryStore
      .getState()
      .setHistory([RECORD, { ...RECORD, batchId: 'batch-2' }]);

    expect(useImportHistoryStore.getState().history).toHaveLength(2);
    expect(
      useImportHistoryStore.getState().history.map((record) => record.batchId),
    ).toEqual(['batch-1', 'batch-2']);
  });
});
