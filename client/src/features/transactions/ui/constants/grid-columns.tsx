import type { GridColumn } from '#shared/adapters/grid';
import type { TransactionViewModel } from '#features/transactions/model/types';

import { formatCurrency } from './format-currency';

// ─── Comparator ──────────────────────────────────────────────────

const amountComparator = (valueA: unknown, valueB: unknown): number => {
  const a = typeof valueA === 'number' && Number.isFinite(valueA) ? valueA : undefined;
  const b = typeof valueB === 'number' && Number.isFinite(valueB) ? valueB : undefined;

  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
};

// ─── Column Definitions ──────────────────────────────────────────

export const TRANSACTION_GRID_COLUMNS: GridColumn<TransactionViewModel>[] = [
  {
    field: 'dateFormatted',
    headerName: 'Data',
    width: 96,
    sortable: true,
  },
  {
    field: 'merchant',
    headerName: 'Opis',
    flex: 1.6,
    sortable: true,
    cellRenderer: ({ data }) => (
      <div className="flex flex-col justify-center gap-0.5 overflow-hidden py-1">
        <span className="truncate text-sm font-medium text-foreground">
          {data.merchant}
        </span>
        {data.description && (
          <span className="truncate text-xs text-muted-foreground">
            {data.description}
          </span>
        )}
      </div>
    ),
  },
  {
    field: 'categoryLabel',
    headerName: 'Kategoria',
    width: 150,
    sortable: false,
    cellRenderer: ({ data }) => {
      if (!data.categoryLabel) {
        return <span className="text-xs text-subtle">—</span>;
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-foreground">
          {data.categoryColor && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: data.categoryColor }}
            />
          )}
          <span className="truncate">{data.categoryLabel}</span>
        </span>
      );
    },
  },
  {
    field: 'accountName',
    headerName: 'Konto',
    width: 130,
    sortable: false,
  },
  {
    field: 'amount',
    headerName: 'Kwota',
    width: 150,
    sortable: true,
    comparator: amountComparator,
    cellRenderer: ({ data }) => {
      if (!Number.isFinite(data.amount)) {
        return <span className="font-mono text-sm tabular-nums text-muted-foreground">—</span>;
      }
      const formatted = formatCurrency(data.amount, data.currency);
      const colorClass = data.type === 'income' ? 'text-income' : 'text-expense';
      return (
        <span className={`font-mono text-sm tabular-nums ${colorClass}`}>
          {formatted}
        </span>
      );
    },
  },
];
