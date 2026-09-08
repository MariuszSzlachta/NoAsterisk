export type {
  DataGridProps,
  GridColumn,
  GridSortConfig,
  CellRendererParams,
  RowAction,
} from '#shared/adapters/grid/ports/grid.port';
import { AgGridAdapter } from '#shared/adapters/grid/adapters/ag-grid/AgGridAdapter';

export const DataGrid = AgGridAdapter;
