import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { ApiError } from '#shared/api';

import { useImportSubmit } from './useImportSubmit';

// ─── Mocks ───────────────────────────────────────────────────────

const submitChunkMock = vi.fn();

vi.mock('#features/csv-import/api/useImportMutation', () => ({
  useImportMutation: () => ({ submitChunk: submitChunkMock }),
}));

vi.mock('#features/csv-import/model/submission/import-chunks', () => ({
  createImportChunks: vi.fn(async (rows: TransactionRow[]) => {
    // Return simple canned chunks — 1 chunk per 50 rows
    const count = rows.filter(
      (r) => r.status === 'ok' || r.status === 'warning',
    ).length;
    const chunkCount = Math.max(1, Math.ceil(count / 50));
    return Array.from({ length: chunkCount }, (_, i) => ({
      batchId: 'test-batch-id',
      batchHash: `hash-${i}`,
      rows: [
        {
          amount: -100,
          currency: 'PLN',
          type: 'expense',
          description: 'test',
          date: '2026-01-01',
          categoryIds: [],
          contentHash: `h-${i}`,
        },
      ],
    }));
  }),
}));

// ─── Test Data ───────────────────────────────────────────────────

const buildRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: `row-${Math.random().toString(36).slice(2, 8)}`,
  date: '2026-01-15',
  title: 'Test Transaction',
  amount: -100,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

const buildRows = (count: number): TransactionRow[] =>
  Array.from({ length: count }, (_, i) =>
    buildRow({ id: `row-${i}`, title: `Transaction ${i}` }),
  );

// ─── Tests ───────────────────────────────────────────────────────

describe('useImportSubmit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useImportWizardStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('canSubmit', () => {
    it('returns false when no rows', () => {
      const { result } = renderHook(() => useImportSubmit());

      expect(result.current.canSubmit).toBe(false);
    });

    it('returns true when importable rows exist', () => {
      useImportWizardStore.setState({ rows: buildRows(5) });

      const { result } = renderHook(() => useImportSubmit());

      expect(result.current.canSubmit).toBe(true);
    });

    it('returns false when all rows are errors/duplicates', () => {
      useImportWizardStore.setState({
        rows: [
          buildRow({ status: 'error' }),
          buildRow({ status: 'duplicate' }),
        ],
      });

      const { result } = renderHook(() => useImportSubmit());

      expect(result.current.canSubmit).toBe(false);
    });
  });

  describe('importableCount', () => {
    it('counts only ok + warning rows', () => {
      useImportWizardStore.setState({
        rows: [
          buildRow({ status: 'ok' }),
          buildRow({ status: 'ok' }),
          buildRow({ status: 'warning' }),
          buildRow({ status: 'error' }),
          buildRow({ status: 'duplicate' }),
        ],
      });

      const { result } = renderHook(() => useImportSubmit());

      expect(result.current.importableCount).toBe(3);
    });
  });

  describe('initial progress', () => {
    it('starts with idle status', () => {
      useImportWizardStore.setState({ rows: buildRows(5) });

      const { result } = renderHook(() => useImportSubmit());

      expect(result.current.progress.status).toBe('idle');
      expect(result.current.progress.totalChunks).toBe(0);
      expect(result.current.progress.savedRows).toBe(0);
    });
  });

  describe('handleSubmit — success', () => {
    it('transitions to completed on success', async () => {
      useImportWizardStore.setState({
        rows: buildRows(3),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock.mockResolvedValue({ saved: 3, duplicatesSkipped: 0 });

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.progress.status).toBe('completed');
      expect(result.current.progress.savedRows).toBe(3);
      expect(result.current.progress.errors).toHaveLength(0);
    });

    it('reports duplicatesSkipped from server response', async () => {
      useImportWizardStore.setState({
        rows: buildRows(5),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock.mockResolvedValue({ saved: 3, duplicatesSkipped: 2 });

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.progress.duplicatesSkipped).toBe(2);
    });
  });

  describe('handleSubmit — failure', () => {
    it('transitions to failed when chunk submission throws non-retryable error', async () => {
      useImportWizardStore.setState({
        rows: buildRows(3),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock.mockRejectedValue(new ApiError('Bad Request', 400));

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.progress.status).toBe('failed');
      expect(result.current.progress.errors.length).toBeGreaterThan(0);
    });

    it('canSubmit remains true after failure (for retry)', async () => {
      useImportWizardStore.setState({
        rows: buildRows(3),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock.mockRejectedValue(new ApiError('Bad Request', 400));

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.canSubmit).toBe(true);
    });
  });

  describe('retry logic', () => {
    it('retries on 5xx errors up to MAX_RETRIES times then succeeds', async () => {
      useImportWizardStore.setState({
        rows: buildRows(3),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock
        .mockRejectedValueOnce(new ApiError('Server Error', 500))
        .mockRejectedValueOnce(new ApiError('Server Error', 500))
        .mockResolvedValueOnce({ saved: 3, duplicatesSkipped: 0 });

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        const promise = result.current.handleSubmit();
        await vi.runAllTimersAsync();
        await promise;
      });

      expect(result.current.progress.status).toBe('completed');
      expect(submitChunkMock).toHaveBeenCalledTimes(3);
    });

    it('fails after exhausting retries on 5xx', async () => {
      useImportWizardStore.setState({
        rows: buildRows(3),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock.mockRejectedValue(new ApiError('Server Error', 500));

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        const promise = result.current.handleSubmit();
        await vi.runAllTimersAsync();
        await promise;
      });

      expect(result.current.progress.status).toBe('failed');
      // 1 initial + 2 retries = 3 calls
      expect(submitChunkMock).toHaveBeenCalledTimes(3);
    });

    it('does not retry on 4xx errors (non-retryable)', async () => {
      useImportWizardStore.setState({
        rows: buildRows(3),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock.mockRejectedValue(new ApiError('Validation Error', 422));

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.progress.status).toBe('failed');
      expect(submitChunkMock).toHaveBeenCalledTimes(1);
    });

    it('retries on 429 Too Many Requests', async () => {
      useImportWizardStore.setState({
        rows: buildRows(3),
        file: new File([''], 'test.csv'),
      });

      submitChunkMock
        .mockRejectedValueOnce(new ApiError('Too Many Requests', 429))
        .mockResolvedValueOnce({ saved: 3, duplicatesSkipped: 0 });

      const { result } = renderHook(() => useImportSubmit());

      await act(async () => {
        const promise = result.current.handleSubmit();
        await vi.runAllTimersAsync();
        await promise;
      });

      expect(result.current.progress.status).toBe('completed');
      expect(submitChunkMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('chunk deduplication on retry', () => {
    it('skips already-completed chunks on second submission', async () => {
      // Setup: 100 rows = 2 chunks (50 each)
      useImportWizardStore.setState({
        rows: buildRows(100),
        file: new File([''], 'test.csv'),
      });

      // First call: chunk 0 succeeds, chunk 1 fails with non-retryable
      submitChunkMock
        .mockResolvedValueOnce({ saved: 50, duplicatesSkipped: 0 })
        .mockRejectedValueOnce(new ApiError('Bad Request', 400));

      const { result } = renderHook(() => useImportSubmit());

      // First attempt
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.progress.status).toBe('failed');
      expect(result.current.progress.savedRows).toBe(50);

      // Retry — should only submit chunk 1
      submitChunkMock.mockClear();
      submitChunkMock.mockResolvedValueOnce({
        saved: 50,
        duplicatesSkipped: 0,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.progress.status).toBe('completed');
      // Only 1 chunk submitted on retry (chunk 0 was skipped)
      expect(submitChunkMock).toHaveBeenCalledTimes(1);
    });
  });
});
