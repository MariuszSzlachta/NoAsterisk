import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { useImportHistory } from '#features/csv-import/ui/hooks/useImportHistory';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

const deleteImportHistoryBatchMock = vi.hoisted(() =>
  vi.fn<() => Promise<void>>(),
);

vi.mock('#features/csv-import/model/persistence', () => ({
  deleteImportHistoryBatch: (...args: unknown[]) =>
    deleteImportHistoryBatchMock(...args),
}));

const RECORD: ImportHistoryRecord = {
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount: 1,
  duplicateCount: 0,
  rejectedCount: 0,
};

describe('useImportHistory', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useImportHistoryStore.setState({ history: [] });
    useTransactionsStore.setState({ transactions: [] });
  });

  it('requires confirmation before deleting a batch', () => {
    useImportHistoryStore.setState({ history: [RECORD] });
    const { result } = renderHook(() => useImportHistory());

    act(() => {
      result.current.requestDelete(RECORD);
    });
    expect(result.current.pendingDelete).toEqual(RECORD);

    act(() => {
      result.current.cancelDelete();
    });

    expect(result.current.pendingDelete).toBeUndefined();
    expect(deleteImportHistoryBatchMock).not.toHaveBeenCalled();
  });

  it('deletes the selected batch and linked in-memory transactions after confirmation', async () => {
    useImportHistoryStore.setState({ history: [RECORD] });
    useTransactionsStore.setState({
      transactions: [
        {
          id: 'selected',
          date: '2026-09-01',
          description: 'Selected',
          amount: -10,
          currency: 'PLN',
          contentHash: 'a'.repeat(64),
          batchId: 'batch-1',
          importedAt: '2026-09-08T10:00:00.000Z',
        },
        {
          id: 'manual',
          date: '2026-09-01',
          description: 'Manual',
          amount: -10,
          currency: 'PLN',
          contentHash: 'b'.repeat(64),
          batchId: 'manual',
          importedAt: '2026-09-08T10:00:00.000Z',
        },
      ],
    });
    deleteImportHistoryBatchMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useImportHistory());

    act(() => {
      result.current.requestDelete(RECORD);
    });
    expect(result.current.pendingDelete).toEqual(RECORD);

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteImportHistoryBatchMock).toHaveBeenCalledWith('batch-1');
    expect(useImportHistoryStore.getState().history).toEqual([]);
    expect(
      useTransactionsStore.getState().transactions.map((record) => record.id),
    ).toEqual(['manual']);
  });
});
