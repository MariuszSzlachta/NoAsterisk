import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

import { useImportWizard } from './useImportWizard';

// ─── Mocks ───────────────────────────────────────────────────────

const mockParseCsvFile = vi.fn();
const mockAutoDetectMapping = vi.fn();
const mockTransformRows = vi.fn();
const mockProcessRows = vi.fn();
const mockLoadAll = vi.fn();
const mockDetectDuplicatesInBatch = vi.fn();

vi.mock('#features/csv-import/model/parsing/csv-parser', () => ({
  parseCsvFile: (...args: unknown[]) => mockParseCsvFile(...args),
}));

vi.mock('#features/csv-import/model/column-mapping/column-mapper', () => ({
  autoDetectMapping: (...args: unknown[]) => mockAutoDetectMapping(...args),
  hasRequiredFields: (mapping: Record<string, unknown>) =>
    'date' in mapping && 'title' in mapping && 'amount' in mapping,
}));

vi.mock('#features/csv-import/model/transformation/row-transformer', () => ({
  transformRows: (...args: unknown[]) => mockTransformRows(...args),
}));

vi.mock('#features/csv-import/model/anonymization/pipeline', () => ({
  processRows: (...args: unknown[]) => mockProcessRows(...args),
}));

vi.mock('#features/csv-import/api/dictionaryProvider', () => ({
  dictionaryProvider: { loadAll: (...args: unknown[]) => mockLoadAll(...args) },
}));

vi.mock('#features/csv-import/model/transformation/duplicate-detector', () => ({
  detectDuplicatesInBatch: (...args: unknown[]) => mockDetectDuplicatesInBatch(...args),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useImportWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useImportWizardStore.getState().reset();
  });

  describe('initial state', () => {
    it('starts at step 0', () => {
      const { result } = renderHook(() => useImportWizard());

      expect(result.current.step).toBe(0);
    });

    it('isFileLoaded is false when no file', () => {
      const { result } = renderHook(() => useImportWizard());

      expect(result.current.isFileLoaded).toBe(false);
    });

    it('hasRows is false when no rows', () => {
      const { result } = renderHook(() => useImportWizard());

      expect(result.current.hasRows).toBe(false);
    });

    it('isProcessing is false initially', () => {
      const { result } = renderHook(() => useImportWizard());

      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('handleFileSelect', () => {
    it('parses file and sets parsed data on success', async () => {
      const parsedData = {
        headers: ['date', 'title', 'amount'],
        rows: [{ date: '2026-01-01', title: 'Test', amount: '100' }],
        separator: ';',
        encoding: 'utf-8',
      };
      mockParseCsvFile.mockResolvedValue(parsedData);
      mockAutoDetectMapping.mockReturnValue({ date: 'date', title: 'title', amount: 'amount' });

      const { result } = renderHook(() => useImportWizard());

      await act(async () => {
        await result.current.handleFileSelect(new File(['test'], 'test.csv'));
      });

      expect(result.current.isFileLoaded).toBe(true);
      expect(result.current.isMappingComplete).toBe(true);
      expect(result.current.parseError).toBeUndefined();
    });

    it('sets parseError on failure', async () => {
      mockParseCsvFile.mockRejectedValue(new Error('Invalid CSV'));

      const { result } = renderHook(() => useImportWizard());

      await act(async () => {
        await result.current.handleFileSelect(new File(['bad'], 'bad.csv'));
      });

      expect(result.current.parseError).toBe('Invalid CSV');
      expect(result.current.isFileLoaded).toBe(false);
    });

    it('guards against double-click (isProcessing)', async () => {
      let resolvePromise: (value: unknown) => void;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockParseCsvFile.mockReturnValue(slowPromise);
      mockAutoDetectMapping.mockReturnValue({});

      const { result } = renderHook(() => useImportWizard());

      // Start first call
      let firstDone = false;
      act(() => {
        result.current.handleFileSelect(new File(['a'], 'a.csv')).then(() => {
          firstDone = true;
        });
      });

      expect(result.current.isProcessing).toBe(true);

      // Second call should be ignored
      await act(async () => {
        await result.current.handleFileSelect(new File(['b'], 'b.csv'));
      });

      expect(mockParseCsvFile).toHaveBeenCalledTimes(1);

      // Resolve first
      await act(async () => {
        resolvePromise!({
          headers: ['a'],
          rows: [],
          separator: ',',
          encoding: 'utf-8',
        });
      });

      expect(firstDone).toBe(true);
    });
  });

  describe('handleMappingConfirm', () => {
    it('advances step and populates rows on success', async () => {
      // Setup: file is already parsed
      const parsedData = {
        headers: ['date', 'title', 'amount'],
        rows: [{ date: '2026-01-01', title: 'BIEDRONKA', amount: '-50' }],
        separator: ';',
        encoding: 'utf-8',
      };
      useImportWizardStore.setState({
        // Test przechodzi w Vitest, ale nie jest zgodny z domenowym kontraktem,
        parsedData,
        columnMapping: { date: 'date', title: 'title', amount: 'amount' },
      });

      const transformed = [
        { id: '1', date: '2026-01-01', title: 'BIEDRONKA', amount: -50, currency: 'PLN', status: 'ok' },
      ];
      const anonymizationEntries = [
        { rowIndex: 0, originalTitle: 'BIEDRONKA', anonymizedTitle: 'BIEDRONKA', spans: [], status: 'safe', accepted: true },
      ];
      // a test sprawdza tylko lokalny krok (0→1). Nie pokrywa realnego flow 1→2→3
      const withDuplicates = [{ ...transformed[0], isDuplicate: false }];

      mockTransformRows.mockReturnValue(transformed);
      mockLoadAll.mockResolvedValue({});
      mockProcessRows.mockReturnValue(anonymizationEntries);
      mockDetectDuplicatesInBatch.mockReturnValue(withDuplicates);

      const { result } = renderHook(() => useImportWizard());

      await act(async () => {
        await result.current.handleMappingConfirm();
      });

      // Assert on observable state, not mock call counts
      expect(result.current.step).toBe(1);
      expect(result.current.hasRows).toBe(true);
      expect(result.current.rowCount).toBe(1);
      expect(result.current.parseError).toBeUndefined();
      expect(result.current.isProcessing).toBe(false);
    });

    it('does not advance step on double-click (isProcessing guard)', async () => {
      useImportWizardStore.setState({
        parsedData: { headers: [], rows: [], separator: ',', encoding: 'utf-8' },
        columnMapping: {},
      });

      let resolveTransform: () => void;
      mockTransformRows.mockReturnValue([]);
      mockLoadAll.mockReturnValue(
        new Promise((resolve) => {
          resolveTransform = () => resolve({});
        }),
      );
      mockProcessRows.mockReturnValue([]);
      mockDetectDuplicatesInBatch.mockReturnValue([]);

      const { result } = renderHook(() => useImportWizard());

      // Start first call
      act(() => {
        result.current.handleMappingConfirm();
      });

      expect(result.current.isProcessing).toBe(true);

      // Second call should be ignored — step should not advance twice
      await act(async () => {
        await result.current.handleMappingConfirm();
      });

      // Still processing (first call not resolved)
      expect(result.current.isProcessing).toBe(true);
      expect(result.current.step).toBe(0);

      // Clean up — resolve first call
      await act(async () => {
        resolveTransform!();
      });

      // Now step advanced exactly once
      expect(result.current.step).toBe(1);
      expect(result.current.isProcessing).toBe(false);
    });

    it('sets parseError when processing fails', async () => {
      useImportWizardStore.setState({
        // obiektu utrzymywanego tylko przez testowy typ inference.
        parsedData: { headers: ['a'], rows: [{ a: '1' }], separator: ',', encoding: 'utf-8' },
        columnMapping: { a: 'date' },
      });

      mockTransformRows.mockImplementation(() => {
        throw new Error('Transform failed');
      });

      const { result } = renderHook(() => useImportWizard());

      await act(async () => {
        await result.current.handleMappingConfirm();
      });

      expect(result.current.parseError).toBe('Transform failed');
    });
  });

  describe('navigation', () => {
    it('handleNextStep increments step', () => {
      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.handleNextStep();
      });

      expect(result.current.step).toBe(1);
    });

    it('handlePrevStep decrements step', () => {
      useImportWizardStore.setState({ step: 2 });

      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.handlePrevStep();
      });

      expect(result.current.step).toBe(1);
    });

    it('handlePrevStep does not go below 0', () => {
      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.handlePrevStep();
      });

      expect(result.current.step).toBe(0);
    });

    it('handleNextStep does not go above 4', () => {
      useImportWizardStore.setState({ step: 4 });

      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.handleNextStep();
      });

      expect(result.current.step).toBe(4);
    });

    it('handleReset sets step to 0 and clears state', () => {
      useImportWizardStore.setState({
        step: 3,
        rows: [{ id: '1', date: '', title: '', amount: 0, currency: '', status: 'ok' }],
      });

      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.handleReset();
      });

      expect(result.current.step).toBe(0);
      expect(result.current.hasRows).toBe(false);
      expect(result.current.isFileLoaded).toBe(false);
    });
  });
});
