import { DataGrid } from '#shared/adapters/grid';
import { PaginationBar } from '#shared/ui/PaginationBar';
import type { TransactionViewModel } from '#features/transactions/model/types';

import { TRANSACTION_GRID_COLUMNS } from '../constants/grid-columns';
import { useTransactionGrid } from '../hooks/useTransactionGrid';

// ─── Constants ───────────────────────────────────────────────────

const ROW_HEIGHT = 46;

const getRowId = (row: TransactionViewModel): string => row.id;

// ─── Types ───────────────────────────────────────────────────────

interface TransactionGridProps {
  readonly onSelectionChange?: (ids: string[]) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const TransactionGrid = ({
  onSelectionChange,
}: TransactionGridProps): React.JSX.Element => {
  const { page, handlePageChange, handlePageSizeChange } = useTransactionGrid();

  return (
    <div className="flex flex-col">
      <DataGrid
        rows={[...page.items]}
        columns={TRANSACTION_GRID_COLUMNS}
        getRowId={getRowId}
        rowHeight={ROW_HEIGHT}
        rowSelection="multiple"
        onSelectionChange={onSelectionChange}
        paginationMode="custom"
        pageSize={page.pageSize}
      />

      <PaginationBar
        currentPage={page.page}
        totalPages={page.totalPages}
        totalRows={page.totalFiltered}
        pageSize={page.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};
