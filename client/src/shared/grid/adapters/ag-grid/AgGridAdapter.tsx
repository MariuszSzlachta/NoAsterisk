import { AgGridReact } from 'ag-grid-react';
import { type ColDef, type GridApi, type CellValueChangedEvent, type SortChangedEvent, type GridReadyEvent, AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { useMemo, useCallback, useRef, useEffect } from 'react';
import type { DataGridProps, GridColumn } from '../../ports/grid.port';

ModuleRegistry.registerModules([AllCommunityModule]);

function mapColumns<TRow>(columns: GridColumn<TRow>[]): ColDef<TRow>[] {
  return columns.map((col): ColDef<TRow> => {
    const colDef: ColDef<TRow> = {
      headerName: col.headerName,
      editable: col.editable ?? false,
      sortable: col.sortable ?? true,
      width: col.width,
      flex: col.flex,
    };

    // ARCH-EXCEPTION: type assertion — AG Grid ColDefField is a recursive template literal
    // incompatible with port's Extract<keyof TRow, string>. Accepted permanently — AG Grid
    // typing limitation, adapter is the correct place to bridge the gap.
    (colDef as Record<string, unknown>)['field'] = col.field;

    if (col.cellRenderer) {
      const renderer = col.cellRenderer;
      colDef.cellRenderer = (params: { value: unknown; data: TRow; rowIndex: number }) => {
        if (!params.data) return null;
        return renderer({ value: params.value, data: params.data, rowIndex: params.rowIndex });
      };
    }

    return colDef;
  });
}

export function AgGridAdapter<TRow>({
  rows,
  columns,
  getRowId,
  onCellEdit,
  sorting,
  onSortChange,
  pageSize,
  rowSelection,
  onSelectionChange,
  loading,
}: DataGridProps<TRow>): React.JSX.Element {
  const columnDefs = useMemo(() => mapColumns(columns), [columns]);
  const gridApiRef = useRef<GridApi<TRow> | null>(null);

  const handleGridReady = useCallback((event: GridReadyEvent<TRow>): void => {
    gridApiRef.current = event.api;
  }, []);

  useEffect(() => {
    if (!gridApiRef.current) return;
    if (sorting) {
      gridApiRef.current.applyColumnState({
        state: [{ colId: sorting.field, sort: sorting.direction }],
        defaultState: { sort: null },
      });
    } else {
      gridApiRef.current.applyColumnState({ defaultState: { sort: null } });
    }
  }, [sorting]);

  const handleCellValueChanged = useCallback((event: CellValueChangedEvent<TRow>): void => {
    if (!onCellEdit || !event.data) return;
    const rowId = getRowId(event.data);
    const field = event.colDef.field;
    if (field) {
      onCellEdit(rowId, field, event.newValue as unknown);
    }
  }, [onCellEdit, getRowId]);

  const handleSortChanged = useCallback((event: SortChangedEvent<TRow>): void => {
    if (!onSortChange) return;
    const sortModel = event.api.getColumnState().find((c) => c.sort);
    if (sortModel?.colId && sortModel.sort) {
      onSortChange({ field: sortModel.colId, direction: sortModel.sort });
    } else {
      onSortChange(undefined);
    }
  }, [onSortChange]);

  const handleSelectionChanged = useCallback((event: { api: { getSelectedRows: () => TRow[] } }): void => {
    if (!onSelectionChange) return;
    const selectedRows = event.api.getSelectedRows();
    onSelectionChange(selectedRows.map(getRowId));
  }, [onSelectionChange, getRowId]);

  return (
    <div className="w-full h-full">
      <AgGridReact<TRow>
        rowData={rows}
        columnDefs={columnDefs}
        getRowId={(params) => getRowId(params.data)}
        onGridReady={handleGridReady}
        onCellValueChanged={handleCellValueChanged}
        onSortChanged={handleSortChanged}
        onSelectionChanged={handleSelectionChanged}
        rowSelection={rowSelection ? { mode: rowSelection === 'single' ? 'singleRow' : 'multiRow' } : undefined}
        loading={loading}
        domLayout="autoHeight"
        pagination={pageSize !== undefined}
        paginationPageSize={pageSize}
      />
    </div>
  );
}
