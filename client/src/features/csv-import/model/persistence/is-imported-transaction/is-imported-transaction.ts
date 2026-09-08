import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { StoredTransaction } from '#features/transactions/model/types';
import { IMPORTED_TRANSACTION_FIELDS } from '#features/csv-import/model/persistence/is-imported-transaction/constants/imported-transaction-fields';
import { isSha256Hex } from '#shared/adapters/persistence/crypto';

/** Guards the import write boundary against malformed records and raw CSV fields. */
export const isImportedTransaction = (value: unknown): value is StoredTransaction =>
  isStoredTransaction(value) &&
  Object.keys(value).every((key) => IMPORTED_TRANSACTION_FIELDS.includes(key)) &&
  value.id.trim().length > 0 &&
  value.date.trim().length > 0 &&
  value.description.trim().length > 0 &&
  value.currency.trim().length > 0 &&
  value.batchId.trim().length > 0 &&
  value.importedAt.trim().length > 0 &&
  (value.categoryId === undefined || value.categoryId.trim().length > 0) &&
  isSha256Hex(value.contentHash);
