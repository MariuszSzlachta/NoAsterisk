import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/types';

import { usePreviewFilters } from './usePreviewFilters';

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

const buildRows = (): TransactionRow[] => [
  buildRow({ id: 'r1', date: '2026-01-10', amount: -50, title: 'Groceries' }),
  buildRow({ id: 'r2', date: '2026-01-15', amount: 8500, title: 'Salary' }),
  buildRow({ id: 'r3', date: '2026-01-20', amount: -200, title: 'Rent' }),
  buildRow({ id: 'r4', date: '2026-02-01', amount: -30, title: 'Netflix' }),
  buildRow({ id: 'r5', date: '2026-02-10', amount: 500, title: 'Refund' }),
];

// ─── Tests ───────────────────────────────────────────────────────

describe('usePreviewFilters', () => {
  describe('initial state', () => {
    it('returns all rows when no filters applied', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      expect(result.current.filteredRows).toHaveLength(5);
      expect(result.current.activeFilterCount).toBe(0);
    });

    it('returns type=all as default filter', () => {
      const { result } = renderHook(() => usePreviewFilters(buildRows()));

      expect(result.current.filters.type).toBe('all');
      expect(result.current.filters.dateFrom).toBe('');
      expect(result.current.filters.dateTo).toBe('');
    });
  });

  describe('type filter', () => {
    it('filters income rows (amount > 0)', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setTypeFilter('income');
      });

      expect(result.current.filteredRows).toHaveLength(2);
      expect(result.current.filteredRows.every((r) => r.amount > 0)).toBe(true);
    });

    it('filters expense rows (amount < 0)', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setTypeFilter('expense');
      });

      expect(result.current.filteredRows).toHaveLength(3);
      expect(result.current.filteredRows.every((r) => r.amount < 0)).toBe(true);
    });

    it('returns all rows when type=all', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setTypeFilter('expense');
      });
      act(() => {
        result.current.setTypeFilter('all');
      });

      expect(result.current.filteredRows).toHaveLength(5);
    });
  });

  describe('date range filter', () => {
    it('filters rows after dateFrom', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setDateFrom('2026-01-20');
      });

      expect(result.current.filteredRows).toHaveLength(3);
      expect(
        result.current.filteredRows.every((r) => r.date >= '2026-01-20'),
      ).toBe(true);
    });

    it('filters rows before dateTo', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setDateTo('2026-01-15');
      });

      expect(result.current.filteredRows).toHaveLength(2);
      expect(
        result.current.filteredRows.every((r) => r.date <= '2026-01-15'),
      ).toBe(true);
    });

    it('filters rows within date range (from + to)', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setDateFrom('2026-01-15');
        result.current.setDateTo('2026-02-01');
      });

      expect(result.current.filteredRows).toHaveLength(3);
      expect(
        result.current.filteredRows.every(
          (r) => r.date >= '2026-01-15' && r.date <= '2026-02-01',
        ),
      ).toBe(true);
    });

    it('returns empty when range excludes all rows', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setDateFrom('2099-01-01');
      });

      expect(result.current.filteredRows).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('applies type + date range together', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setTypeFilter('expense');
        result.current.setDateFrom('2026-01-15');
      });

      // Expenses on or after 2026-01-15: Rent(-200), Netflix(-30)
      expect(result.current.filteredRows).toHaveLength(2);
      expect(result.current.filteredRows.every((r) => r.amount < 0)).toBe(true);
      expect(
        result.current.filteredRows.every((r) => r.date >= '2026-01-15'),
      ).toBe(true);
    });
  });

  describe('activeFilterCount', () => {
    it('counts 0 when no filters active', () => {
      const { result } = renderHook(() => usePreviewFilters(buildRows()));

      expect(result.current.activeFilterCount).toBe(0);
    });

    it('counts 1 when only type filter active', () => {
      const { result } = renderHook(() => usePreviewFilters(buildRows()));

      act(() => {
        result.current.setTypeFilter('income');
      });

      expect(result.current.activeFilterCount).toBe(1);
    });

    it('counts 2 when type + dateFrom active', () => {
      const { result } = renderHook(() => usePreviewFilters(buildRows()));

      act(() => {
        result.current.setTypeFilter('expense');
        result.current.setDateFrom('2026-01-15');
      });

      expect(result.current.activeFilterCount).toBe(2);
    });

    it('counts 3 when all filters active', () => {
      const { result } = renderHook(() => usePreviewFilters(buildRows()));

      act(() => {
        result.current.setTypeFilter('income');
        result.current.setDateFrom('2026-01-01');
        result.current.setDateTo('2026-12-31');
      });

      expect(result.current.activeFilterCount).toBe(3);
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to initial state', () => {
      const rows = buildRows();
      const { result } = renderHook(() => usePreviewFilters(rows));

      act(() => {
        result.current.setTypeFilter('income');
        result.current.setDateFrom('2026-01-15');
        result.current.setDateTo('2026-02-01');
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.type).toBe('all');
      expect(result.current.filters.dateFrom).toBe('');
      expect(result.current.filters.dateTo).toBe('');
      expect(result.current.filteredRows).toHaveLength(5);
      expect(result.current.activeFilterCount).toBe(0);
    });
  });

  describe('reactivity to row changes', () => {
    it('re-filters when rows prop changes', () => {
      const initialRows = buildRows();
      const { result, rerender } = renderHook(
        ({ rows }) => usePreviewFilters(rows),
        { initialProps: { rows: initialRows } },
      );

      act(() => {
        result.current.setTypeFilter('income');
      });

      expect(result.current.filteredRows).toHaveLength(2);

      // Add another income row
      const updatedRows = [
        ...initialRows,
        buildRow({
          id: 'r6',
          amount: 1000,
          date: '2026-03-01',
          title: 'Bonus',
        }),
      ];
      rerender({ rows: updatedRows });

      expect(result.current.filteredRows).toHaveLength(3);
    });
  });
});
