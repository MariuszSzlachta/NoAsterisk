import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataGrid } from '#shared/adapters/grid';
import { Checkbox } from '#shared/ui/Checkbox';
import { Card } from '#shared/ui/Card';
import { useInfiniteScroll } from '#shared/hooks';
import { PaginationBar } from '#shared/ui/PaginationBar';
import type { TransactionViewModel } from '#features/transactions/model/types';

import { formatCurrency, TRANSACTION_GRID_COLUMNS } from '../constants';
import { useTransactionGrid } from '../hooks/useTransactionGrid';

// ─── Constants ───────────────────────────────────────────────────

const ROW_HEIGHT = 46;
const MOBILE_BATCH_SIZE = 20;

const getRowId = (row: TransactionViewModel): string => row.id;

// ─── Types ───────────────────────────────────────────────────────

interface TransactionGridProps {
  readonly onSelectionChange?: (ids: string[]) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const TransactionGrid = ({
  onSelectionChange,
}: TransactionGridProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { page, allItems, handlePageChange, handlePageSizeChange } = useTransactionGrid();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_BATCH_SIZE);

  useEffect(() => {
    setMobileVisibleCount(MOBILE_BATCH_SIZE);
  }, [allItems]);

  const handleLoadMore = useCallback((): void => {
    setMobileVisibleCount((count) =>
      Math.min(count + MOBILE_BATCH_SIZE, allItems.length),
    );
  }, [allItems.length]);
  const mobileSentinelRef = useInfiniteScroll({
    hasMore: mobileVisibleCount < allItems.length,
    onLoadMore: handleLoadMore,
  });

  const handleMobileSelectionChange = (id: string, checked: boolean): void => {
    const nextSelectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
    setSelectedIds(nextSelectedIds);
    onSelectionChange?.(nextSelectedIds);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-none">
      <div className="hidden lg:block lg:[&>div]:!h-auto">
        <DataGrid
          rows={[...page.items]}
          columns={TRANSACTION_GRID_COLUMNS}
          getRowId={getRowId}
          rowHeight={ROW_HEIGHT}
          rowSelection="multiple"
          onSelectionChange={onSelectionChange}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 lg:hidden">
        {allItems.slice(0, mobileVisibleCount).map((transaction) => (
          <Card
            key={transaction.id}
            className="!h-auto shrink-0 gap-0 border-border bg-surface-2 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Checkbox
                  aria-label={`Zaznacz ${transaction.merchant}`}
                  checked={selectedIds.includes(transaction.id)}
                  onChange={(event) =>
                    handleMobileSelectionChange(transaction.id, event.target.checked)
                  }
                  className="pt-0.5"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {transaction.merchant}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {transaction.description || transaction.categoryLabel || '—'}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 font-mono text-sm tabular-nums ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}
              >
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
              <span>{transaction.dateFormatted}</span>
              <span>
                {transaction.categoryLabel || t('transactions.form.categoryPlaceholder')}
              </span>
            </div>
          </Card>
        ))}
        {mobileVisibleCount < allItems.length && <div ref={mobileSentinelRef} className="h-1" />}
      </div>

      <div className="hidden lg:block">
        <PaginationBar
          currentPage={page.page}
          totalPages={page.totalPages}
          totalRows={page.totalFiltered}
          pageSize={page.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="flex-wrap gap-2 px-3 py-3 lg:flex-nowrap lg:px-4 lg:py-2"
        />
      </div>
    </div>
  );
};
