import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

import { useBatchEditPanel } from './useBatchEditPanel';

// ─── Mocks ───────────────────────────────────────────────────────

const mockFindSimilarRows = vi.fn();

vi.mock('#features/csv-import/model/transformation/find-similar-rows', () => ({
  findSimilarRows: (...args: unknown[]) => mockFindSimilarRows(...args),
}));

// ─── Test Data ───────────────────────────────────────────────────

const buildRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: `row-${Math.random().toString(36).slice(2, 8)}`,
  date: '2026-01-15',
  title: 'BIEDRONKA KATOWICE',
  amount: -50,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

const buildSimilarRows = (): TransactionRow[] => [
  buildRow({ id: 'r1', title: 'BIEDRONKA KATOWICE' }),
  buildRow({ id: 'r2', title: 'BIEDRONKA WARSZAWA' }),
  buildRow({ id: 'r3', title: 'BIEDRONKA KRAKÓW' }),
  buildRow({ id: 'r4', title: 'LIDL KATOWICE' }),
];

// ─── Tests ───────────────────────────────────────────────────────

describe('useBatchEditPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useImportWizardStore.getState().reset();
  });

  describe('initial state', () => {
    it('panel is closed initially', () => {
      useImportWizardStore.setState({ rows: buildSimilarRows() });

      const { result } = renderHook(() => useBatchEditPanel());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.field).toBeUndefined();
      expect(result.current.similarRows).toHaveLength(0);
    });
  });

  describe('handleCellEdit', () => {
    it('ignores non-title/category fields', () => {
      useImportWizardStore.setState({ rows: buildSimilarRows() });

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'date', '2026-02-01');
      });

      expect(result.current.isOpen).toBe(false);
      expect(mockFindSimilarRows).not.toHaveBeenCalled();
    });

    it('ignores non-string values', () => {
      useImportWizardStore.setState({ rows: buildSimilarRows() });

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'title', 123);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('updates the edited row immediately', () => {
      useImportWizardStore.setState({ rows: buildSimilarRows() });
      mockFindSimilarRows.mockReturnValue([]);

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'category', 'Zakupy spożywcze');
      });

      const updatedRow = useImportWizardStore
        .getState()
        .rows.find((r) => r.id === 'r1');
      expect(updatedRow?.category).toBe('Zakupy spożywcze');
    });

    it('opens batch panel when similar rows found', () => {
      const rows = buildSimilarRows();
      useImportWizardStore.setState({ rows });
      mockFindSimilarRows.mockReturnValue([rows[1], rows[2]]);

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'category', 'Zakupy spożywcze');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.field).toBe('category');
      expect(result.current.newValue).toBe('Zakupy spożywcze');
      expect(result.current.similarRows).toHaveLength(2);
    });

    it('does not open panel when no similar rows', () => {
      useImportWizardStore.setState({ rows: buildSimilarRows() });
      mockFindSimilarRows.mockReturnValue([]);

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'category', 'Groceries');
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('does not open panel for empty title (sets error status instead)', () => {
      useImportWizardStore.setState({ rows: buildSimilarRows() });
      mockFindSimilarRows.mockReturnValue([]);

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'title', '   ');
      });

      expect(result.current.isOpen).toBe(false);
      const row = useImportWizardStore
        .getState()
        .rows.find((r) => r.id === 'r1');
      expect(row?.status).toBe('error');
    });
  });

  describe('handleApply', () => {
    it('applies edit to all similar rows and closes panel', () => {
      const rows = buildSimilarRows();
      useImportWizardStore.setState({ rows });
      mockFindSimilarRows.mockReturnValue([rows[1], rows[2]]);

      const { result } = renderHook(() => useBatchEditPanel());

      // Open batch panel
      act(() => {
        result.current.handleCellEdit('r1', 'category', 'Zakupy');
      });

      expect(result.current.isOpen).toBe(true);

      // Apply
      act(() => {
        result.current.handleApply();
      });

      expect(result.current.isOpen).toBe(false);

      const state = useImportWizardStore.getState();
      const r2 = state.rows.find((r) => r.id === 'r2');
      const r3 = state.rows.find((r) => r.id === 'r3');
      expect(r2?.category).toBe('Zakupy');
      expect(r3?.category).toBe('Zakupy');
    });

    it('does not affect rows not in similarRowIds', () => {
      const rows = buildSimilarRows();
      useImportWizardStore.setState({ rows });
      mockFindSimilarRows.mockReturnValue([rows[1]]);

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'category', 'Zakupy');
      });
      act(() => {
        result.current.handleApply();
      });

      const r4 = useImportWizardStore
        .getState()
        .rows.find((r) => r.id === 'r4');
      expect(r4?.category).toBeUndefined();
    });
  });

  describe('handleSkip', () => {
    it('closes panel without applying batch edit', () => {
      const rows = buildSimilarRows();
      useImportWizardStore.setState({ rows });
      mockFindSimilarRows.mockReturnValue([rows[1], rows[2]]);

      const { result } = renderHook(() => useBatchEditPanel());

      act(() => {
        result.current.handleCellEdit('r1', 'category', 'Zakupy');
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.handleSkip();
      });

      expect(result.current.isOpen).toBe(false);

      // Similar rows should NOT be updated
      const r2 = useImportWizardStore
        .getState()
        .rows.find((r) => r.id === 'r2');
      expect(r2?.category).toBeUndefined();
    });
  });
});
