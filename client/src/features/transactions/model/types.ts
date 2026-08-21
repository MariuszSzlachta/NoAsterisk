// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Model Types
// ═══════════════════════════════════════════════════════════════════

// ─── Stored Transaction (persistence shape) ──────────────────────

export interface StoredTransaction {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly categoryId?: string;
  readonly accountName?: string;
  readonly contentHash: string;
  readonly batchId: string;
  readonly importedAt: string;
  readonly budgetId?: string;
}

// ─── Category Lookup ─────────────────────────────────────────────
// CategoryInfo now lives in #entities/category

// ─── Transaction ViewModel (UI-ready) ────────────────────────────

export type TransactionType = 'income' | 'expense';

export interface TransactionViewModel {
  readonly id: string;
  readonly date: string;
  readonly dateFormatted: string;
  readonly merchant: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly type: TransactionType;
  readonly categoryId?: string;
  readonly categoryLabel?: string;
  readonly categoryColor?: string;
  readonly accountName?: string;
}

// ─── Filters ─────────────────────────────────────────────────────

export interface TransactionFilters {
  readonly type?: TransactionType;
  readonly categoryId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly search?: string;
}

// ─── Sorting ─────────────────────────────────────────────────────

export type TransactionSortField = 'date' | 'amount' | 'merchant';

export interface TransactionSort {
  readonly field: TransactionSortField;
  readonly direction: 'asc' | 'desc';
}

// ─── Pagination Result ───────────────────────────────────────────

export interface TransactionPage {
  readonly items: ReadonlyArray<TransactionViewModel>;
  readonly total: number;
  readonly totalFiltered: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

// ─── Computed Stats ──────────────────────────────────────────────

export interface TransactionStats {
  readonly totalCount: number;
  readonly uncategorizedCount: number;
  readonly expenseSum: number;
  readonly incomeSum: number;
}
