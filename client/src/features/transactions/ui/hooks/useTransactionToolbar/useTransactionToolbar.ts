import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { useDebounce } from '#shared/hooks/useDebounce';

import { useTransactionFilters } from '../useTransactionFilters';

// ─── Constants ───────────────────────────────────────────────────

const SEARCH_DEBOUNCE_MS = 300;

// ─── Types ───────────────────────────────────────────────────────

interface UseTransactionToolbarResult {
  readonly searchValue: string;
  readonly activeTypeTab: string;
  readonly dateRange: DateRange | undefined;
  readonly handleSearchInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleTypeTabChange: (tab: string) => void;
  readonly handleDateRangeChange: (range: DateRange | undefined) => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useTransactionToolbar = (): UseTransactionToolbarResult => {
  const { filters, setTypeFilter, setDateRange, setSearch } =
    useTransactionFilters();

  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const debouncedSearch = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? '')) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, setSearch, filters.search]);

  const activeTypeTab = filters.type ?? 'all';

  const dateRange: DateRange | undefined =
    filters.dateFrom || filters.dateTo
      ? {
          from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          to: filters.dateTo ? new Date(filters.dateTo) : undefined,
        }
      : undefined;

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchValue(e.target.value);
  };

  const handleTypeTabChange = (tab: string): void => {
    const type = tab === 'income' || tab === 'expense' ? tab : undefined;
    setTypeFilter(type);
  };

  const handleDateRangeChange = (range: DateRange | undefined): void => {
    const from = range?.from?.toISOString().slice(0, 10);
    const to = range?.to?.toISOString().slice(0, 10);
    setDateRange(from, to);
  };

  return {
    searchValue,
    activeTypeTab,
    dateRange,
    handleSearchInputChange,
    handleTypeTabChange,
    handleDateRangeChange,
  };
};
