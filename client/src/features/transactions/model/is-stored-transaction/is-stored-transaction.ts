import { isStoredTransaction as isModelStoredTransaction } from '#model/transaction';
import type { StoredTransaction } from '#model/transaction';

export const isStoredTransaction = (
  value: unknown,
): value is StoredTransaction => isModelStoredTransaction(value);
