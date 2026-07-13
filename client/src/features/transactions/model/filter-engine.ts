// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Filter Engine (pure functions)
// Client-side filtering, sorting, and pagination.
// ═══════════════════════════════════════════════════════════════════

import type {
  TransactionFilters,
  TransactionPage,
  TransactionSort,
  TransactionStats,
  TransactionViewModel,
} from './types';

// ─── Filter ──────────────────────────────────────────────────────

export const filterTransactions = (
  rows: ReadonlyArray<TransactionViewModel>,
  filters: TransactionFilters,
): ReadonlyArray<TransactionViewModel> => {
  let result = rows;

  if (filters.type) {
    result = result.filter((r) => r.type === filters.type);
  }

  if (filters.categoryId) {
    result = result.filter((r) => r.categoryId === filters.categoryId);
  }

  if (filters.dateFrom) {
    const dateFrom = filters.dateFrom;
    result = result.filter((r) => r.date >= dateFrom);
  }

  if (filters.dateTo) {
    const dateTo = filters.dateTo;
    result = result.filter((r) => r.date <= dateTo);
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.merchant.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term),
    );
  }

  return result;
};

// ─── Sort ────────────────────────────────────────────────────────

const SORT_COMPARATORS: Record<
  TransactionSort['field'],
  (a: TransactionViewModel, b: TransactionViewModel) => number
> = {
  date: (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0),
  amount: (a, b) => a.amount - b.amount,
  merchant: (a, b) => a.merchant.localeCompare(b.merchant, 'pl'),
};

export const sortTransactions = (
  rows: ReadonlyArray<TransactionViewModel>,
  sort: TransactionSort,
): ReadonlyArray<TransactionViewModel> => {
  const comparator = SORT_COMPARATORS[sort.field];
  const multiplier = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => comparator(a, b) * multiplier);
};

// ─── Paginate ────────────────────────────────────────────────────

export const paginateTransactions = (
  rows: ReadonlyArray<TransactionViewModel>,
  page: number,
  pageSize: number,
  totalBeforeFilter: number,
): TransactionPage => {
  const totalFiltered = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return {
    items,
    total: totalBeforeFilter,
    totalFiltered,
    page: safePage,
    pageSize,
    totalPages,
  };
};

// ─── Stats ───────────────────────────────────────────────────────

export const computeStats = (
  rows: ReadonlyArray<TransactionViewModel>,
): TransactionStats => {
  let uncategorizedCount = 0;
  let expenseSum = 0;
  let incomeSum = 0;

  for (const row of rows) {
    if (!row.categoryId) {
      uncategorizedCount++;
    }
    if (row.type === 'expense') {
      expenseSum += row.amount;
    } else {
      incomeSum += row.amount;
    }
  }

  return {
    totalCount: rows.length,
    uncategorizedCount,
    expenseSum,
    incomeSum,
  };
};
