// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Create Transaction Types
// ═══════════════════════════════════════════════════════════════════

// ─── Form Values ─────────────────────────────────────────────────

export type { CreateTransactionFormValues } from '#entities/transaction';

// ─── Validation Errors ───────────────────────────────────────────

export interface CreateTransactionErrors {
  readonly title?: string;
  readonly amount?: string;
  readonly date?: string;
  readonly type?: string;
}
