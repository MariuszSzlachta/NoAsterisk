import type { RestorableVaultPayload } from '#features/user-settings/model/vault-payload';
import {
  IMPORT_HISTORY_COLLECTION,
  TRANSACTIONS_COLLECTION,
  type EncryptedCollectionWrite,
} from '#shared/adapters/persistence/ports';

export const createVaultCollectionWrites = (
  payload: RestorableVaultPayload,
): ReadonlyArray<EncryptedCollectionWrite> =>
  payload.schemaVersion === 0
    ? [
        { collection: TRANSACTIONS_COLLECTION, records: payload.transactions },
        { collection: 'rules', records: payload.rules },
      ]
    : [
        { collection: TRANSACTIONS_COLLECTION, records: payload.transactions },
        { collection: 'rules', records: payload.rules },
        { collection: 'categories', records: payload.categories },
        { collection: 'budgets', records: payload.budgets },
        { collection: 'period-history', records: payload.periodHistory },
        {
          collection: IMPORT_HISTORY_COLLECTION,
          records: payload.importHistory,
        },
      ];
