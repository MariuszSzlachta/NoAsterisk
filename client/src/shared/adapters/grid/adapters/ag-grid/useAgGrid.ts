import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  type CellValueChangedEvent,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type SortChangedEvent,
} from 'ag-grid-community';

import type {
  DataGridProps,
  GridColumn,
} from '#shared/adapters/grid/ports/grid.port';

const mapColumns = <TRow>(columns: GridColumn<TRow>[]): ColDef<TRow>[] => {
  return columns.map((col): ColDef<TRow> => {
    const colDef: ColDef<TRow> = {
      headerName: col.headerName,
      editable: col.editable ?? false,
      sortable: col.sortable ?? true,
      width: col.width,
      minWidth: col.minWidth,
      flex: col.flex,
    };

    // AG Grid's recursive ColDefField type cannot represent the simpler port field.
    // Define the field at runtime while keeping the adapter boundary typed.
    Object.defineProperty(colDef, 'field', {
      configurable: true,
      enumerable: true,
      value: col.field,
      writable: true,
    });

    if (col.comparator) {
      const portComparator = col.comparator;
      colDef.comparator = (
        valueA: unknown,
        valueB: unknown,
        nodeA: { data: TRow | undefined },
        nodeB: { data: TRow | undefined },
      ) => {
        if (!nodeA.data || !nodeB.data) {
          return 0;
        }
        return portComparator(valueA, valueB, nodeA.data, nodeB.data);
      };
    }

    if (col.cellRenderer) {
      const renderer = col.cellRenderer;
      colDef.cellRenderer = (params: {
        value: unknown;
        data: TRow;
        rowIndex: number;
      }) => {
        if (!params.data) {
          return null;
        }
        return renderer({
          value: params.value,
          data: params.data,
          rowIndex: params.rowIndex,
        });
      };
    }

    return colDef;
  });
};

interface UseAgGridResult<TRow> {
  columnDefs: ColDef<TRow>[];
  handleGridReady: (event: GridReadyEvent<TRow>) => void;
  handleCellValueChanged: (event: CellValueChangedEvent<TRow>) => void;
  handleSortChanged: (event: SortChangedEvent<TRow>) => void;
  handleSelectionChanged: (event: {
    api: { getSelectedRows: () => TRow[] };
  }) => void;
}

export const useAgGrid = <TRow>({
  columns,
  getRowId,
  sorting,
  onCellEdit,
  onSortChange,
  onSelectionChange,
}: Pick<
  DataGridProps<TRow>,
  | 'columns'
  | 'getRowId'
  | 'sorting'
  | 'onCellEdit'
  | 'onSortChange'
  | 'onSelectionChange'
>): UseAgGridResult<TRow> => {
  const gridApiRef = useRef<GridApi<TRow> | null>(null);
  const columnDefs = useMemo(() => mapColumns(columns), [columns]);

  const handleGridReady = useCallback((event: GridReadyEvent<TRow>): void => {
    gridApiRef.current = event.api;
  }, []);

  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }
    if (sorting) {
      gridApiRef.current.applyColumnState({
        state: [{ colId: sorting.field, sort: sorting.direction }],
        defaultState: { sort: null },
      });
    } else {
      gridApiRef.current.applyColumnState({ defaultState: { sort: null } });
    }
  }, [sorting]);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<TRow>): void => {
      if (!onCellEdit || !event.data) {
        return;
      }
      const field = event.colDef.field;
      if (field) {
        onCellEdit(getRowId(event.data), field, event.newValue);
      }
    },
    [onCellEdit, getRowId],
  );

  const handleSortChanged = useCallback(
    (event: SortChangedEvent<TRow>): void => {
      if (!onSortChange) {
        return;
      }
      const sortModel = event.api.getColumnState().find((c) => c.sort);
      if (sortModel?.colId && sortModel.sort) {
        onSortChange({
          field: sortModel.colId,
          direction: sortModel.sort,
        });
      } else {
        onSortChange(undefined);
      }
    },
    [onSortChange],
  );

  const handleSelectionChanged = useCallback(
    (event: { api: { getSelectedRows: () => TRow[] } }): void => {
      if (!onSelectionChange) {
        return;
      }
      onSelectionChange(event.api.getSelectedRows().map(getRowId));
    },
    [onSelectionChange, getRowId],
  );

  return {
    columnDefs,
    handleGridReady,
    handleCellValueChanged,
    handleSortChanged,
    handleSelectionChanged,
  };
};
