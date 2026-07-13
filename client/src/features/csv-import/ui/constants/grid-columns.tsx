import type { TFunction } from 'i18next';

import type { GridColumn } from '#shared/adapters/grid';
import type { TransactionRow } from '#features/csv-import/model/types';

export const createImportGridColumns = (
  t: TFunction,
): GridColumn<TransactionRow>[] => [
  {
    field: 'status',
    headerName: t('import.grid.status'),
    width: 44,
    sortable: false,
    cellRenderer: ({ value }) => {
      const status = value as TransactionRow['status'];
      const indicators: Record<TransactionRow['status'], { color: string; label: string }> = {
        ok: { color: 'bg-income', label: 'OK' },
        warning: { color: 'bg-warning', label: t('import.preview.warnings', { count: 1 }) },
        duplicate: { color: 'bg-muted-foreground', label: t('import.preview.duplicates', { count: 1 }) },
        error: { color: 'bg-expense', label: t('import.preview.errors', { count: 1 }) },
      };
      const { color, label } = indicators[status];
      return (
        <div className="flex h-full items-center justify-center" title={label}>
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        </div>
      );
    },
  },
  {
    field: 'date',
    headerName: t('import.grid.date'),
    width: 110,
    sortable: true,
  },
  {
    field: 'title',
    headerName: t('import.grid.title'),
    flex: 2,
    editable: true,
    sortable: true,
  },
  {
    field: 'amount',
    headerName: t('import.grid.amount'),
    width: 120,
    sortable: true,
    comparator: (valueA: unknown, valueB: unknown) => {
      const isValidA = typeof valueA === 'number' && !Number.isNaN(valueA);
      const isValidB = typeof valueB === 'number' && !Number.isNaN(valueB);
      if (!isValidA && !isValidB) {
        return 0;
      }
      if (!isValidA) {
        return -1;
      }
      if (!isValidB) {
        return 1;
      }
      return valueA - valueB;
    },
    cellRenderer: ({ value }) => {
      const amount = value as number;
      if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
        return (
          <span className="text-xs text-expense">—</span>
        );
      }
      const isNegative = amount < 0;
      const formatted = new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Math.abs(amount));
      return (
        <span
          className={`font-mono text-sm tabular-nums ${isNegative ? 'text-expense' : 'text-income'}`}
        >
          {isNegative ? `−${formatted}` : `+${formatted}`}
        </span>
      );
    },
  },
  {
    field: 'currency',
    headerName: t('import.grid.currency'),
    width: 70,
    sortable: false,
  },
  {
    field: 'category',
    headerName: t('import.grid.category'),
    width: 140,
    editable: true,
    sortable: true,
    cellRenderer: ({ value }) => {
      const category = value as string | undefined;
      if (!category) {
        return (
          <span className="text-xs text-muted-foreground italic">
            {t('import.preview.noCategory')}
          </span>
        );
      }
      return <span className="text-sm">{category}</span>;
    },
  },
  {
    field: 'statusReason',
    headerName: t('import.grid.info'),
    flex: 1,
    sortable: false,
    cellRenderer: ({ value }) => {
      const reason = value as string | undefined;
      if (!reason) {
        return null;
      }
      return <span className="text-xs text-muted-foreground">{reason}</span>;
    },
  },
];

export const IMPORT_GRID_PAGE_SIZE = 50;
export const IMPORT_GRID_ROW_HEIGHT = 36;
