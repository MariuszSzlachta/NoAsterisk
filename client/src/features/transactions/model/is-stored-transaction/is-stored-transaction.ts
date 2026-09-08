import { isStoredTransaction as isEntityStoredTransaction } from '#entities/transaction';
import type { StoredTransaction } from '#entities/transaction';

export const isStoredTransaction = (
  value: unknown,
): value is StoredTransaction => isEntityStoredTransaction(value);
