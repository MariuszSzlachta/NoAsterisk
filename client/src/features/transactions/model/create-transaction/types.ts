// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Create Transaction Types
// ═══════════════════════════════════════════════════════════════════

// ─── Form Values ─────────────────────────────────────────────────

export interface CreateTransactionFormValues {
  readonly title: string;
  readonly amount: string;
  readonly date: string;
  readonly type: 'income' | 'expense';
  readonly categoryId: string;
}

// ─── Validation Errors ───────────────────────────────────────────

export interface CreateTransactionErrors {
  readonly title?: string;
  readonly amount?: string;
  readonly date?: string;
  readonly type?: string;
}
