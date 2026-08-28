import type { StoredTransaction } from '#features/transactions/model/types';

/** Runtime type guard: validates each item has required StoredTransaction fields */
export const isStoredTransactionArray = (
  items: ReadonlyArray<Record<string, unknown>>,
): items is ReadonlyArray<StoredTransaction> =>
  items.every(
    (item) =>
      typeof item['id'] === 'string' &&
      typeof item['date'] === 'string' &&
      typeof item['description'] === 'string' &&
      typeof item['amount'] === 'number' &&
      typeof item['currency'] === 'string' &&
      typeof item['contentHash'] === 'string' &&
      typeof item['batchId'] === 'string' &&
      typeof item['importedAt'] === 'string',
  );
