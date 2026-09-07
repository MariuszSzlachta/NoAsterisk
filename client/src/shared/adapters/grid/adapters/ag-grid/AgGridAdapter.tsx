import { useState } from 'react';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import { useAgGrid } from '#shared/adapters/grid/adapters/ag-grid/useAgGrid';
import type {
  DataGridProps,
  RowAction,
} from '#shared/adapters/grid/ports/grid.port';
import { DropdownMenu, type DropdownMenuEntry } from '#shared/ui/DropdownMenu';
import { PaginationBar } from '#shared/ui/PaginationBar';

ModuleRegistry.registerModules([AllCommunityModule]);

const budgetTheme = themeQuartz
  .withParams({
    foregroundColor: 'var(--fg)',
    backgroundColor: 'transparent',
    headerBackgroundColor: 'var(--surface-2)',
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

const RowActionsCell = <TRow,>({
  data,
  actions,
}: {
  data: TRow;
  actions: RowAction<TRow>[] | ((row: TRow) => RowAction<TRow>[]);
}): React.JSX.Element => {
  const resolvedActions = typeof actions === 'function' ? actions(data) : actions;
  const items: DropdownMenuEntry[] = resolvedActions.map((a) => ({
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
  onCellClick,
  sorting,
  onSortChange,
  pageSize,
  paginationMode = 'builtin',
  rowSelection,
  onSelectionChange,
  loading,
  rowHeight,
  rowActions,
  getRowClass,
}: DataGridProps<TRow>): React.JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [customPageSize, setCustomPageSize] = useState(pageSize ?? 50);

  const isCustomPagination = paginationMode === 'custom' && pageSize !== undefined;
  const totalRows = rows.length;
  const totalPages = isCustomPagination ? Math.max(1, Math.ceil(totalRows / customPageSize)) : 1;
  const displayRows = isCustomPagination
    ? rows.slice((currentPage - 1) * customPageSize, currentPage * customPageSize)
    : rows;

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number): void => {
    setCustomPageSize(size);
    setCurrentPage(1);
  };

  const {
    columnDefs,
    handleGridReady,
    handleCellValueChanged,
    handleSortChanged,
    handleSelectionChanged,
  } = useAgGrid({
    columns,
    getRowId,
    sorting,
    onCellEdit,
    onSortChange,
    onSelectionChange,
  });

  const allColumnDefs: ColDef<TRow>[] = rowActions
    ? [
        ...columnDefs,
        {
          colId: 'actions',
          headerName: '',
          width: 48,
          maxWidth: 48,
          sortable: false,
          suppressNavigable: true,
          cellRenderer: (params: { data: TRow }) => {
            if (!params.data) {
              return null;
            }
            return <RowActionsCell data={params.data} actions={rowActions} />;
          },
        },
      ]
    : columnDefs;

  const handleGetRowClass = getRowClass
    ? (params: { data: TRow | undefined }): string | undefined =>
        params.data === undefined ? undefined : getRowClass(params.data)
    : undefined;

  const handleCellClicked = onCellClick
    ? (params: { data: TRow | undefined; colDef: { field?: string } }): void => {
        if (params.data && params.colDef.field) {
          onCellClick(params.data, params.colDef.field);
        }
      }
    : undefined;

  return (
    <div className="h-full w-full">
      <AgGridReact<TRow>
        theme={budgetTheme}
        rowData={displayRows}
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
        pagination={!isCustomPagination && pageSize !== undefined}
        paginationPageSize={!isCustomPagination ? pageSize : undefined}
        rowHeight={rowHeight}
        getRowClass={handleGetRowClass}
        onCellClicked={handleCellClicked}
      />
      {isCustomPagination && totalRows > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalRows={totalRows}
          pageSize={customPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
};
