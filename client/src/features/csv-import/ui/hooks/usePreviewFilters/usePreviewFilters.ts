import { useMemo, useState } from 'react';

import type { TransactionRow } from '#features/csv-import/model/types';
import type { TransactionTypeFilter } from '#features/csv-import/ui/hooks/usePreviewFilters/transaction-type-filter';
import { INITIAL_FILTERS } from '#features/csv-import/ui/hooks/usePreviewFilters/initial-filters';
import { matchesTypeFilter } from '#features/csv-import/ui/hooks/usePreviewFilters/matches-type-filter';
import { matchesDateRange } from '#features/csv-import/ui/hooks/usePreviewFilters/matches-date-range';

interface PreviewFilters {
  readonly type: TransactionTypeFilter;
  readonly dateFrom: string;
  readonly dateTo: string;
}

interface PreviewFiltersResult {
  readonly filters: PreviewFilters;
  readonly filteredRows: ReadonlyArray<TransactionRow>;
  readonly activeFilterCount: number;
  readonly setTypeFilter: (type: TransactionTypeFilter) => void;
  readonly setDateFrom: (date: string) => void;
  readonly setDateTo: (date: string) => void;
  readonly resetFilters: () => void;
}

export const usePreviewFilters = (
  rows: ReadonlyArray<TransactionRow>,
): PreviewFiltersResult => {
  const [filters, setFilters] = useState<PreviewFilters>(INITIAL_FILTERS);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesTypeFilter(row, filters.type) &&
          matchesDateRange(row, filters.dateFrom, filters.dateTo),
      ),
    [rows, filters],
  );

  const activeFilterCount =
    (filters.type !== 'all' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const setTypeFilter = (type: TransactionTypeFilter): void => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const setDateFrom = (date: string): void => {
    setFilters((prev) => ({ ...prev, dateFrom: date }));
  };

  const setDateTo = (date: string): void => {
    setFilters((prev) => ({ ...prev, dateTo: date }));
  };

  const resetFilters = (): void => {
    setFilters(INITIAL_FILTERS);
  };

  return {
    filters,
    filteredRows,
    activeFilterCount,
    setTypeFilter,
    setDateFrom,
    setDateTo,
    resetFilters,
  };
};
