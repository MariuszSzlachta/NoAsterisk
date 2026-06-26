import { AllCommunityModule, ModuleRegistry, themeQuartz, createTheme } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import type { DataGridProps } from '#shared/grid/ports/grid.port';
import { useAgGrid } from '#shared/grid/adapters/ag-grid/useAgGrid';

ModuleRegistry.registerModules([AllCommunityModule]);

const budgetTheme = createTheme()
  .withPart(themeQuartz)
  .withParams({
    foregroundColor: 'var(--fg)',
    backgroundColor: 'transparent',
    headerBackgroundColor: 'var(--surface-2)',
    headerForegroundColor: 'var(--fg-subtle)',
    headerFontSize: 11.5,
    headerFontWeight: 500,
    headerTextColor: 'var(--fg-subtle)',
    borderColor: 'var(--border)',
    rowBorder: { color: 'var(--border)', width: 1, style: 'solid' },
    selectedRowBackgroundColor: 'var(--primary-soft)',
    rowHoverColor: 'var(--surface-2)',
    fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
    fontSize: 13,
    headerHeight: 42,
    checkboxCheckedBackgroundColor: 'var(--primary)',
    checkboxCheckedBorderColor: 'var(--primary)',
    checkboxCheckedShapeColor: '#ffffff',
    checkboxUncheckedBackgroundColor: 'transparent',
    checkboxUncheckedBorderColor: 'var(--border-strong)',
    checkboxBorderRadius: 4,
    wrapperBorder: false,
    columnBorder: false,
    headerColumnBorder: false,
  });

const SELECTION_COL_DEF = { width: 42, maxWidth: 42, minWidth: 42 };

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
  rowHeight,
}: DataGridProps<TRow>): React.JSX.Element => {
  const { columnDefs, handleGridReady, handleCellValueChanged, handleSortChanged, handleSelectionChanged } =
    useAgGrid({ columns, getRowId, sorting, onCellEdit, onSortChange, onSelectionChange });

  return (
    <div className="h-full w-full">
      <AgGridReact<TRow>
        theme={budgetTheme}
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
        selectionColumnDef={rowSelection ? SELECTION_COL_DEF : undefined}
        loading={loading}
        domLayout="autoHeight"
        pagination={pageSize !== undefined}
        paginationPageSize={pageSize}
        rowHeight={rowHeight}
      />
    </div>
  );
};
