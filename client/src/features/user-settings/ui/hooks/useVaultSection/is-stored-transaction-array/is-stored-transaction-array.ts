import type { StoredTransaction } from '#features/transactions/model/types';
import { isRecord } from '#features/user-settings/ui/hooks/useVaultSection/is-record';

/** Runtime type guard: validates each item has required StoredTransaction fields */
export const isStoredTransactionArray = (
  items: ReadonlyArray<unknown>,
): items is ReadonlyArray<StoredTransaction> =>
  items.every(
    (item) =>
      isRecord(item) &&
      typeof item['id'] === 'string' &&
      typeof item['date'] === 'string' &&
      typeof item['description'] === 'string' &&
      typeof item['amount'] === 'number' &&
      typeof item['currency'] === 'string' &&
      typeof item['contentHash'] === 'string' &&
      typeof item['batchId'] === 'string' &&
      typeof item['importedAt'] === 'string',
  );
