import type { TransactionTypeFilter } from '#features/csv-import/ui/hooks/usePreviewFilters/transaction-type-filter';

interface PreviewFilters {
  readonly type: TransactionTypeFilter;
  readonly dateFrom: string;
  readonly dateTo: string;
}

export const INITIAL_FILTERS: PreviewFilters = {
  type: 'all',
  dateFrom: '',
  dateTo: '',
};
