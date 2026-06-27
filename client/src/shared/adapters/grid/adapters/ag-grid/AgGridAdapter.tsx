import { AllCommunityModule, ModuleRegistry, themeQuartz, createTheme } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import type { DataGridProps, RowAction } from '#shared/adapters/grid/ports/grid.port';
import { useAgGrid } from '#shared/adapters/grid/adapters/ag-grid/useAgGrid';
import { DropdownMenu, type DropdownMenuEntry } from '#shared/ui/DropdownMenu';

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

const RowActionsCell = <TRow,>({ data, actions }: { data: TRow; actions: RowAction<TRow>[] }): React.JSX.Element => {
  const items: DropdownMenuEntry[] = actions.map((a) => ({
    label: a.label,
    icon: a.icon,
    variant: a.variant,
    disabled: a.disabled,
    onClick: () => a.onClick(data),
  }));
  return (
    <div className="flex h-full items-center justify-center">
      <DropdownMenu items={items} />
    </div>
  );
};

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
  rowActions,
}: DataGridProps<TRow>): React.JSX.Element => {
  const { columnDefs, handleGridReady, handleCellValueChanged, handleSortChanged, handleSelectionChanged } =
    useAgGrid({ columns, getRowId, sorting, onCellEdit, onSortChange, onSelectionChange });

  const allColumnDefs: ColDef<TRow>[] = rowActions
    ? [...columnDefs, {
        colId: 'actions',
        headerName: '',
        width: 48,
        maxWidth: 48,
        sortable: false,
        suppressNavigable: true,
        cellRenderer: (params: { data: TRow }) => {
          if (!params.data) return null;
          return <RowActionsCell data={params.data} actions={rowActions} />;
        },
      }]
    : columnDefs;

  return (
    <div className="h-full w-full">
      <AgGridReact<TRow>
        theme={budgetTheme}
        rowData={rows}
        columnDefs={allColumnDefs}
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
