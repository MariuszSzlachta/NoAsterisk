// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Map Form Values to StoredTransaction
// ═══════════════════════════════════════════════════════════════════

import { mapFormValuesToStored as mapEntityFormValuesToStored } from '#entities/transaction';
import type { StoredTransaction } from '#entities/transaction';

import type { CreateTransactionFormValues } from './types';

export const mapFormValuesToStored = (
  values: CreateTransactionFormValues,
): StoredTransaction => mapEntityFormValuesToStored(values);
