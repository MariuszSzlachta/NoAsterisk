// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Map Form Values to StoredTransaction
// ═══════════════════════════════════════════════════════════════════

import type { StoredTransaction } from '#features/transactions/model/types';

import type { CreateTransactionFormValues } from './types';

// ─── Constants ───────────────────────────────────────────────────

const MANUAL_BATCH_ID = 'manual';
const DEFAULT_CURRENCY = 'PLN';

// ─── Mapper ──────────────────────────────────────────────────────

export const mapFormValuesToStored = (
  values: CreateTransactionFormValues,
): StoredTransaction => ({
  id: crypto.randomUUID(),
  date: values.date,
  description: values.title.trim(),
  amount:
    values.type === 'expense'
      ? -Math.abs(Number(values.amount))
      : Math.abs(Number(values.amount)),
  currency: DEFAULT_CURRENCY,
  categoryId: values.categoryId || undefined,
  contentHash: crypto.randomUUID(),
  batchId: MANUAL_BATCH_ID,
  importedAt: new Date().toISOString(),
});
