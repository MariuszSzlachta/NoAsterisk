import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import type { DataGridProps } from '#shared/grid/ports/grid.port';
import { useAgGrid } from '#shared/grid/adapters/ag-grid/useAgGrid';

ModuleRegistry.registerModules([AllCommunityModule]);

export const AgGridAdapter = <TRow,>({
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
}: DataGridProps<TRow>): React.JSX.Element => {
  const { columnDefs, handleGridReady, handleCellValueChanged, handleSortChanged, handleSelectionChanged } =
    useAgGrid({ columns, getRowId, sorting, onCellEdit, onSortChange, onSelectionChange });

  return (
    <div className="h-full w-full">
      <AgGridReact<TRow>
        rowData={rows}
        columnDefs={columnDefs}
        getRowId={(params) => getRowId(params.data)}
        onGridReady={handleGridReady}
        onCellValueChanged={handleCellValueChanged}
        onSortChanged={handleSortChanged}
        onSelectionChanged={handleSelectionChanged}
        rowSelection={
          rowSelection
            ? { mode: rowSelection === 'single' ? 'singleRow' : 'multiRow' }
            : undefined
        }
        loading={loading}
        domLayout="autoHeight"
        pagination={pageSize !== undefined}
        paginationPageSize={pageSize}
      />
    </div>
  );
};
