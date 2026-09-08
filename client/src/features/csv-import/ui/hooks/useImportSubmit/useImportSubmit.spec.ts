import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry';
import type { PreparedImportedTransactions } from '#features/csv-import/model/persistence/types';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { useImportSubmit } from '#features/csv-import/ui/hooks/useImportSubmit/useImportSubmit';
import type { StoredTransaction } from '#entities/transaction/types';
import { useTransactionsStore } from '#entities/transaction/useTransactionsStore';
import { apiClient } from '#shared/api';

const prepareImportedTransactionsMock = vi.fn();
const categorizeImportedTransactionsMock = vi.fn();
const saveImportedBatchMock = vi.fn();

vi.mock('#features/csv-import/model/persistence', () => ({
  INITIAL_IMPORT_PROGRESS: {
    totalRows: 0,
    savedRows: 0,
    duplicatesSkipped: 0,
    rejectedRows: [],
    errors: [],
    status: 'idle',
  },
  IMPORT_PROGRESS_STATUS: {
    idle: 'idle',
    submitting: 'submitting',
    completed: 'completed',
    failed: 'failed',
  },
  prepareImportedTransactions: (...args: unknown[]) =>
    prepareImportedTransactionsMock(...args),
  categorizeImportedTransactions: (...args: unknown[]) =>
    categorizeImportedTransactionsMock(...args),
  saveImportedBatch: (...args: unknown[]) => saveImportedBatchMock(...args),
  selectAcceptedImportRows: (
    rows: ReadonlyArray<TransactionRow>,
    entries: ReadonlyArray<AnonymizationEntry>,
  ) =>
    rows.flatMap((row, rowIndex) => {
      const entry = entries.find((item) => item.rowIndex === rowIndex);
      return row.status !== 'error' &&
        row.status !== 'duplicate' &&
        entry?.accepted === true
        ? [{ row, rowIndex, description: entry.anonymizedTitle }]
        : [];
    }),
}));

const buildRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: 'row-1',
  date: '2026-01-15',
  title: 'Safe title',
  amount: -100,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

const buildEntry = (
  rowIndex: number,
  overrides: Partial<AnonymizationEntry> = {},
): AnonymizationEntry => ({
  rowIndex,
  originalTitle: 'Original PII title',
  anonymizedTitle: 'Safe title',
  spans: [],
  status: 'safe',
  accepted: true,
  ...overrides,
});

const buildRecord = (
  overrides: Partial<StoredTransaction> = {},
): StoredTransaction => ({
  id: 'row-1',
  date: '2026-01-15',
  description: 'Safe title',
  amount: -100,
  currency: 'PLN',
  contentHash: 'content-hash',
  batchId: 'batch-1',
  importedAt: '2026-01-15T12:00:00.000Z',
  ...overrides,
});

const buildPrepared = (
  records: ReadonlyArray<StoredTransaction>,
): PreparedImportedTransactions => ({
  records,
  rejectedRows: [],
});

describe('useImportSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useImportWizardStore.getState().reset();
    useTransactionsStore.setState({ transactions: [] });
    useImportHistoryStore.setState({ history: [] });
    saveImportedBatchMock.mockResolvedValue({
      written: [buildRecord()],
      duplicatesSkipped: 0,
      historyRecord: {
        batchId: 'batch-1',
        fileName: 'unknown.csv',
        completedAt: '2026-09-08T10:00:00.000Z',
        acceptedCount: 1,
        duplicateCount: 0,
        rejectedCount: 0,
      },
    });
    const records = [buildRecord()];
    prepareImportedTransactionsMock.mockResolvedValue(buildPrepared(records));
    categorizeImportedTransactionsMock.mockImplementation(
      (items: ReadonlyArray<StoredTransaction>) => items,
    );
  });

  afterEach(() => {
    useImportWizardStore.getState().reset();
    useTransactionsStore.setState({ transactions: [] });
    useImportHistoryStore.setState({ history: [] });
  });

  it('only enables submit for accepted post-review rows', () => {
    useImportWizardStore.setState({
      rows: [
        buildRow(),
        buildRow({ id: 'row-2', status: 'warning' }),
        buildRow({ id: 'row-3', status: 'error' }),
      ],
      anonymizationEntries: [
        buildEntry(0),
        buildEntry(1, { accepted: false, status: 'needs_review' }),
        buildEntry(2),
      ],
    });

    const { result } = renderHook(() => useImportSubmit());

    expect(result.current.importableCount).toBe(1);
    expect(result.current.canSubmit).toBe(true);
  });

  it('starts idle and disables submit without accepted rows', () => {
    const { result } = renderHook(() => useImportSubmit());

    expect(result.current.progress.status).toBe('idle');
    expect(result.current.canSubmit).toBe(false);
  });

  it('persists locally, updates the transactions store and clears wizard PII', async () => {
    useImportWizardStore.setState({
      rows: [buildRow()],
      anonymizationEntries: [buildEntry(0)],
    });
    const { result } = renderHook(() => useImportSubmit());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.progress.status).toBe('completed');
    expect(result.current.progress.savedRows).toBe(1);
    expect(useTransactionsStore.getState().transactions).toEqual([
      buildRecord(),
    ]);
    expect(useImportWizardStore.getState().rows).toEqual([]);
    expect(useImportWizardStore.getState().anonymizationEntries).toEqual([]);
    expect(saveImportedBatchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        batchId: expect.any(String),
        rejectedCount: 0,
      }),
    );
  });

  it('reports duplicates and rejected rows in the completion summary', async () => {
    const prepared: PreparedImportedTransactions = {
      records: [buildRecord()],
      rejectedRows: [{ rowIndex: 2, reason: 'Duplicate row' }],
    };
    prepareImportedTransactionsMock.mockResolvedValue(prepared);
    saveImportedBatchMock.mockResolvedValue({
      written: [],
      duplicatesSkipped: 1,
      historyRecord: {
        batchId: 'batch-1',
        fileName: 'unknown.csv',
        completedAt: '2026-09-08T10:00:00.000Z',
        acceptedCount: 0,
        duplicateCount: 1,
        rejectedCount: 1,
      },
    });
    useImportWizardStore.setState({
      rows: [buildRow()],
      anonymizationEntries: [buildEntry(0)],
    });
    const { result } = renderHook(() => useImportSubmit());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.progress.duplicatesSkipped).toBe(1);
    expect(result.current.progress.rejectedRows).toEqual([
      { rowIndex: 2, reason: 'Duplicate row' },
    ]);
  });

  it('does not write to local memory when preparation validation fails', async () => {
    prepareImportedTransactionsMock.mockRejectedValue(
      new Error('Accepted import row is not valid for local persistence'),
    );
    useImportWizardStore.setState({
      rows: [buildRow()],
      anonymizationEntries: [buildEntry(0)],
    });
    const { result } = renderHook(() => useImportSubmit());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.progress.status).toBe('failed');
    expect(result.current.progress.errors).toEqual([
      'Accepted import row is not valid for local persistence',
    ]);
    expect(saveImportedBatchMock).not.toHaveBeenCalled();
    expect(useTransactionsStore.getState().transactions).toEqual([]);
  });

  it('performs no HTTP import request', async () => {
    const postSpy = vi.spyOn(apiClient, 'post');
    useImportWizardStore.setState({
      rows: [buildRow()],
      anonymizationEntries: [buildEntry(0)],
    });
    const { result } = renderHook(() => useImportSubmit());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(postSpy).not.toHaveBeenCalled();
    postSpy.mockRestore();
  });

  it('does not submit the completed wizard twice', async () => {
    useImportWizardStore.setState({
      rows: [buildRow()],
      anonymizationEntries: [buildEntry(0)],
    });
    const { result } = renderHook(() => useImportSubmit());

    await act(async () => {
      await result.current.handleSubmit();
      await result.current.handleSubmit();
    });

    expect(saveImportedBatchMock).toHaveBeenCalledTimes(1);
    expect(useTransactionsStore.getState().transactions).toHaveLength(1);
  });

  it('allows retry after a failed local write', async () => {
    saveImportedBatchMock
      .mockRejectedValueOnce(new Error('Storage unavailable'))
      .mockResolvedValueOnce({
        written: [buildRecord()],
        duplicatesSkipped: 0,
        historyRecord: {
          batchId: 'batch-1',
          fileName: 'unknown.csv',
          completedAt: '2026-09-08T10:00:00.000Z',
          acceptedCount: 1,
          duplicateCount: 0,
          rejectedCount: 0,
        },
      });
    useImportWizardStore.setState({
      rows: [buildRow()],
      anonymizationEntries: [buildEntry(0)],
    });
    const { result } = renderHook(() => useImportSubmit());

    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.progress.status).toBe('failed');
    expect(result.current.canSubmit).toBe(true);

    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.progress.status).toBe('completed');
  });

  it('uses a stable fallback message for unknown local persistence failures', async () => {
    saveImportedBatchMock.mockRejectedValueOnce(undefined);
    useImportWizardStore.setState({
      rows: [buildRow()],
      anonymizationEntries: [buildEntry(0)],
    });
    const { result } = renderHook(() => useImportSubmit());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.progress.errors).toEqual(['Local import failed']);
  });
});
