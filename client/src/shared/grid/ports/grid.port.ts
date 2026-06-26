import type { ReactNode } from 'react';

export interface GridColumn<TRow> {
  field: Extract<keyof TRow, string>;
  headerName: string;
  editable?: boolean;
  sortable?: boolean;
  width?: number;
  flex?: number;
  cellRenderer?: (params: CellRendererParams<TRow>) => ReactNode;
}

export interface CellRendererParams<TRow> {
  value: unknown;
  data: TRow;
  rowIndex: number;
}

export interface RowAction<TRow> {
  label: string;
  icon?: ReactNode;
  onClick: (row: TRow) => void;
  variant?: 'default' | 'danger';
}

export interface GridSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataGridProps<TRow> {
  rows: TRow[];
  columns: GridColumn<TRow>[];
  getRowId: (row: TRow) => string;
  onCellEdit?: (rowId: string, field: string, value: unknown) => void;
  sorting?: GridSortConfig;
  onSortChange?: (sort: GridSortConfig | undefined) => void;
  pageSize?: number;
  rowSelection?: 'single' | 'multiple';
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean;
  rowHeight?: number;
  rowActions?: RowAction<TRow>[];
}

// TODO: post-MVP — server-side pagination (requires controlled page state)
// Will be added when backend supports paginated grid endpoints.
// interface ServerPaginationConfig {
//   currentPage: number;
//   totalRows: number;
//   onPageChange: (page: number) => void;
// }

// TODO: post-MVP — AG Grid Enterprise features
// groupBy and expandableRow require AG Grid Enterprise license.
// Will be added if/when Enterprise is licensed.
// interface EnterpriseGridProps<TRow> extends DataGridProps<TRow> {
//   groupBy?: string;
//   expandableRow?: (row: TRow) => ReactNode;
// }
