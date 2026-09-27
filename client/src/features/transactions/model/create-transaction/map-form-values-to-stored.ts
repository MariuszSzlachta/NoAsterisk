// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Map Form Values to StoredTransaction
// ═══════════════════════════════════════════════════════════════════

import { mapFormValuesToStored as mapModelFormValuesToStored } from '#model/transaction';
import type { StoredTransaction } from '#model/transaction';

import type { CreateTransactionFormValues } from './types';

export const mapFormValuesToStored = (
  values: CreateTransactionFormValues,
): StoredTransaction => mapModelFormValuesToStored(values);
