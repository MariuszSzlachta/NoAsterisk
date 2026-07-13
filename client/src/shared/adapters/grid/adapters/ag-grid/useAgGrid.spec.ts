import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAgGrid } from '#shared/adapters/grid/adapters/ag-grid/useAgGrid';
import type { GridColumn } from '#shared/adapters/grid/ports/grid.port';

interface TestRow {
  id: string;
  name: string;
  amount: number;
}

const testColumns: GridColumn<TestRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'amount', headerName: 'Amount', sortable: false, editable: true },
];

const getRowId = (row: TestRow): string => row.id;

describe('useAgGrid', () => {
  describe('column mapping', () => {
    it('maps port columns to AG Grid ColDef format', () => {
      const { result } = renderHook(() =>
        useAgGrid({ columns: testColumns, getRowId, sorting: undefined }),
      );

      expect(result.current.columnDefs).toHaveLength(2);
      expect(result.current.columnDefs[0]).toMatchObject({
        headerName: 'Name',
        sortable: true,
        editable: false,
      });
    });

    it('respects sortable and editable overrides', () => {
      const { result } = renderHook(() =>
        useAgGrid({ columns: testColumns, getRowId, sorting: undefined }),
      );

      expect(result.current.columnDefs[1]).toMatchObject({
        headerName: 'Amount',
        sortable: false,
        editable: true,
      });
    });

    it('maps width and flex properties', () => {
      const columns: GridColumn<TestRow>[] = [
        { field: 'name', headerName: 'Name', width: 200, flex: 1 },
      ];

      const { result } = renderHook(() =>
        useAgGrid({ columns, getRowId, sorting: undefined }),
      );

      expect(result.current.columnDefs[0]).toMatchObject({
        width: 200,
        flex: 1,
      });
    });

    it('maps custom comparator to AG Grid comparator function', () => {
      const comparator = (a: unknown, b: unknown): number =>
        (a as number) - (b as number);

      const columns: GridColumn<TestRow>[] = [
        { field: 'amount', headerName: 'Amount', comparator },
      ];

      const { result } = renderHook(() =>
        useAgGrid({ columns, getRowId, sorting: undefined }),
      );

      const colDef = result.current.columnDefs[0];
      expect(colDef.comparator).toBeDefined();

      const nodeA = { data: { id: '1', name: 'A', amount: 10 } };
      const nodeB = { data: { id: '2', name: 'B', amount: 5 } };
      const agResult = (colDef.comparator as Function)(10, 5, nodeA, nodeB, false);
      expect(agResult).toBe(5);
    });

    it('returns 0 from comparator when row data is undefined', () => {
      const comparator = vi.fn().mockReturnValue(1);
      const columns: GridColumn<TestRow>[] = [
        { field: 'amount', headerName: 'Amount', comparator },
      ];

      const { result } = renderHook(() =>
        useAgGrid({ columns, getRowId, sorting: undefined }),
      );

      const colDef = result.current.columnDefs[0];
      const agResult = (colDef.comparator as Function)(10, 5, { data: undefined }, { data: undefined }, false);
      expect(agResult).toBe(0);
      expect(comparator).not.toHaveBeenCalled();
    });
  });

  describe('cell edit handler', () => {
    it('calls onCellEdit with rowId, field, and new value', () => {
      const onCellEdit = vi.fn();
      const { result } = renderHook(() =>
        useAgGrid({
          columns: testColumns,
          getRowId,
          sorting: undefined,
          onCellEdit,
        }),
      );

      result.current.handleCellValueChanged({
        data: { id: 'row-1', name: 'Test', amount: 100 },
        colDef: { field: 'name' },
        newValue: 'Updated',
      } as never);

      expect(onCellEdit).toHaveBeenCalledWith('row-1', 'name', 'Updated');
    });

    it('does not call onCellEdit when callback is undefined', () => {
      const { result } = renderHook(() =>
        useAgGrid({ columns: testColumns, getRowId, sorting: undefined }),
      );

      expect(() =>
        result.current.handleCellValueChanged({
          data: { id: 'row-1', name: 'Test', amount: 100 },
          colDef: { field: 'name' },
          newValue: 'Updated',
        } as never),
      ).not.toThrow();
    });
  });

  describe('sort handler', () => {
    it('calls onSortChange with field and direction', () => {
      const onSortChange = vi.fn();
      const { result } = renderHook(() =>
        useAgGrid({
          columns: testColumns,
          getRowId,
          sorting: undefined,
          onSortChange,
        }),
      );

      result.current.handleSortChanged({
        api: {
          getColumnState: () => [{ colId: 'amount', sort: 'asc' }],
        },
      } as never);

      expect(onSortChange).toHaveBeenCalledWith({
        field: 'amount',
        direction: 'asc',
      });
    });

    it('calls onSortChange with undefined when no sort active', () => {
      const onSortChange = vi.fn();
      const { result } = renderHook(() =>
        useAgGrid({
          columns: testColumns,
          getRowId,
          sorting: undefined,
          onSortChange,
        }),
      );

      result.current.handleSortChanged({
        api: { getColumnState: () => [] },
      } as never);

      expect(onSortChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('selection handler', () => {
    it('calls onSelectionChange with selected row ids', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() =>
        useAgGrid({
          columns: testColumns,
          getRowId,
          sorting: undefined,
          onSelectionChange,
        }),
      );

      result.current.handleSelectionChanged({
        api: {
          getSelectedRows: () => [
            { id: 'row-1', name: 'A', amount: 10 },
            { id: 'row-3', name: 'C', amount: 30 },
          ],
        },
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['row-1', 'row-3']);
    });
  });
});
