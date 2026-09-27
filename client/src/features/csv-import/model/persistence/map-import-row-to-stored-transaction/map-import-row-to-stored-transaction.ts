import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import type { StoredTransaction } from '#model/transaction/types';
import type { ImportMappingContext } from '#features/csv-import/model/persistence/types';
import { INVALID_IMPORT_ROW } from '#features/csv-import/model/persistence/map-import-row-to-stored-transaction/constants/invalid-import-row';
import { isSha256Hex } from '#shared/adapters/persistence/crypto';

/**
 * Whitelists the post-review persistence shape so raw CSV fields and original
 * titles cannot cross the feature boundary into the encrypted repository.
 */
export const mapImportRowToStoredTransaction = (
  row: TransactionRow,
  context: ImportMappingContext,
): StoredTransaction => {
  const requiredValues = [
    context.id,
    context.description,
    context.contentHash,
    context.batchId,
    context.importedAt,
    row.date,
    row.currency,
  ];
  const containsBlankValue = requiredValues.some((value) => value.trim().length === 0);

  if (containsBlankValue || !Number.isFinite(row.amount) || !isSha256Hex(context.contentHash)) {
    throw new Error(INVALID_IMPORT_ROW);
  }

  return {
    id: context.id,
    date: row.date,
    description: context.description,
    amount: row.amount,
    currency: row.currency,
    categoryId: row.category?.trim() || undefined,
    contentHash: context.contentHash,
    batchId: context.batchId,
    importedAt: context.importedAt,
  };
};
