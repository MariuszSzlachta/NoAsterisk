import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useImportHistoryStore } from '#entities/import-batch';
import { createVaultRestorePlan } from '#features/user-settings/model/create-vault-restore-plan';
import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';
import type {
  DecryptedVaultPayload,
  RestorableVaultPayload,
} from '#features/user-settings/model/vault-payload';
import { useCategoriesStore } from '#entities/category';
import {
  IMPORT_HISTORY_COLLECTION,
  TRANSACTIONS_COLLECTION,
  type EncryptedCollectionWrite,
} from '#shared/adapters/persistence/ports';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const toWrites = (
  payload: RestorableVaultPayload,
): ReadonlyArray<EncryptedCollectionWrite> => {
  if (payload.schemaVersion === 0) {
    return [
      { collection: TRANSACTIONS_COLLECTION, records: payload.transactions },
      { collection: 'rules', records: payload.rules },
    ];
  }

  return [
    { collection: TRANSACTIONS_COLLECTION, records: payload.transactions },
    { collection: 'rules', records: payload.rules },
    { collection: 'categories', records: payload.categories },
    { collection: 'budgets', records: payload.budgets },
    { collection: 'period-history', records: payload.periodHistory },
    { collection: IMPORT_HISTORY_COLLECTION, records: payload.importHistory },
  ];
};

const applyPayloadToStores = (payload: RestorableVaultPayload): void => {
  useTransactionsStore.setState({ transactions: payload.transactions });
  useRulesStore.setState({ rules: payload.rules });

  if (payload.schemaVersion === 1) {
    useCategoriesStore.setState({ categories: payload.categories });
    useBudgetsStore.setState({ budgets: payload.budgets });
    usePeriodHistoryStore.setState({ history: payload.periodHistory });
    useImportHistoryStore.getState().setHistory(payload.importHistory);
  }
};

export const restoreVaultPayload = async (
  payload: DecryptedVaultPayload,
): Promise<void> => {
  const plan = createVaultRestorePlan(payload);
  if (plan === undefined) {
    throw new VaultPayloadError('Vault payload failed validation');
  }

  await encryptedPersistence.replaceCollections(toWrites(plan.payload));
  applyPayloadToStores(plan.payload);
};
