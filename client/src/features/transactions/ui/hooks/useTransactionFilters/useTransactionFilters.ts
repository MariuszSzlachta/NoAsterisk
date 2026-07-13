import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type {
  TransactionFilters,
  TransactionSort,
  TransactionSortField,
  TransactionType,
} from '#features/transactions/model/types';

// ─── Constants ───────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_SORT: TransactionSort = { field: 'date', direction: 'desc' };

// ─── Types ───────────────────────────────────────────────────────

interface UseTransactionFiltersResult {
  readonly filters: TransactionFilters;
  readonly sort: TransactionSort;
  readonly page: number;
  readonly pageSize: number;
  readonly setTypeFilter: (type: TransactionType | undefined) => void;
  readonly setDateRange: (from: string | undefined, to: string | undefined) => void;
  readonly setCategoryFilter: (categoryId: string | undefined) => void;
  readonly setSearch: (search: string) => void;
  readonly setPage: (page: number) => void;
  readonly setSort: (field: TransactionSortField, direction: 'asc' | 'desc') => void;
  readonly resetFilters: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────

const parseType = (raw: string | null): TransactionType | undefined => {
  if (raw === 'income' || raw === 'expense') {
    return raw;
  }
  return undefined;
};

const parseSortField = (raw: string | null): TransactionSortField => {
  if (raw === 'date' || raw === 'amount' || raw === 'merchant') {
    return raw;
  }
  return DEFAULT_SORT.field;
};

const parseDirection = (raw: string | null): 'asc' | 'desc' => {
  if (raw === 'asc' || raw === 'desc') {
    return raw;
  }
  return DEFAULT_SORT.direction;
};

// ─── Hook ────────────────────────────────────────────────────────

export const useTransactionFilters = (): UseTransactionFiltersResult => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TransactionFilters = useMemo(
    () => ({
      type: parseType(searchParams.get('type')),
      categoryId: searchParams.get('categoryId') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    }),
    [searchParams],
  );

  const sort: TransactionSort = useMemo(
    () => ({
      field: parseSortField(searchParams.get('sortBy')),
      direction: parseDirection(searchParams.get('sortDir')),
    }),
    [searchParams],
  );

  const page = Number(searchParams.get('page')) || DEFAULT_PAGE;
  const pageSize = DEFAULT_PAGE_SIZE;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined && value !== '') {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setTypeFilter = useCallback(
    (type: TransactionType | undefined) => {
      updateParams({ type, page: undefined });
    },
    [updateParams],
  );

  const setDateRange = useCallback(
    (from: string | undefined, to: string | undefined) => {
      updateParams({ dateFrom: from, dateTo: to, page: undefined });
    },
    [updateParams],
  );

  const setCategoryFilter = useCallback(
    (categoryId: string | undefined) => {
      updateParams({ categoryId, page: undefined });
    },
    [updateParams],
  );

  const setSearch = useCallback(
    (search: string) => {
      updateParams({ search: search || undefined, page: undefined });
    },
    [updateParams],
  );

  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage > 1 ? String(newPage) : undefined });
    },
    [updateParams],
  );

  const setSort = useCallback(
    (field: TransactionSortField, direction: 'asc' | 'desc') => {
      const isDefault = field === DEFAULT_SORT.field && direction === DEFAULT_SORT.direction;
      updateParams({
        sortBy: isDefault ? undefined : field,
        sortDir: isDefault ? undefined : direction,
        page: undefined,
      });
    },
    [updateParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    filters,
    sort,
    page,
    pageSize,
    setTypeFilter,
    setDateRange,
    setCategoryFilter,
    setSearch,
    setPage,
    setSort,
    resetFilters,
  };
};
