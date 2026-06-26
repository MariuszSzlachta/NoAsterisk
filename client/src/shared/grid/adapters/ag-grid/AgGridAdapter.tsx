import { AllCommunityModule, ModuleRegistry, themeQuartz, createTheme } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useState, useRef, useEffect } from 'react';

import type { DataGridProps, RowAction } from '#shared/grid/ports/grid.port';
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

const KebabMenu = <TRow,>({ data, actions }: { data: TRow; actions: RowAction<TRow>[] }): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex h-full items-center justify-center">
      <button
        className="ag-row-action-btn flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-surface-3 hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-lg border border-border bg-surface p-1 shadow-card">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs ${
                action.variant === 'danger' ? 'text-expense hover:bg-expense-soft' : 'text-foreground hover:bg-surface-3'
              }`}
              onClick={(e) => { e.stopPropagation(); action.onClick(data); setOpen(false); }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
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
        cellRenderer: (params: { data: TRow }) => {
          if (!params.data) return null;
          return <KebabMenu data={params.data} actions={rowActions} />;
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
