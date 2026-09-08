import { create } from 'zustand';

// ARCH-EXCEPTION: cross-feature import — auto-categorize must read rules to assign category
// to new manual transactions. Same pattern as useApplyRules hook — accepted permanently.
import { autoCategorize, useRulesStore } from '#features/admin-rules';
import { mapFormValuesToStored } from '#features/transactions/model/create-transaction/map-form-values-to-stored';
import type { CreateTransactionFormValues } from '#features/transactions/model/create-transaction/types';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { StoredTransaction } from '#features/transactions/model/types';
import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import { TRANSACTIONS_COLLECTION } from '#shared/adapters/persistence/ports';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const transactionRepository =
  encryptedPersistence.repository<StoredTransaction>(
    TRANSACTIONS_COLLECTION,
    isStoredTransaction,
    (record) => record.id,
  );

interface TransactionsState {
  readonly transactions: ReadonlyArray<StoredTransaction>;
  readonly addTransaction: (
    values: CreateTransactionFormValues,
  ) => StoredTransaction;
  readonly addTransactions: (rows: ReadonlyArray<StoredTransaction>) => void;
  readonly updateCategory: (id: string, categoryId: string | undefined) => void;
  readonly bulkUpdateCategory: (
    ids: ReadonlyArray<string>,
    categoryId: string,
  ) => void;
  readonly assignBudget: (
    transactionIds: ReadonlyArray<string>,
    budgetId: string,
  ) => void;
  readonly removeBudget: (transactionIds: ReadonlyArray<string>) => void;
  readonly deleteTransactions: (ids: ReadonlyArray<string>) => void;
  readonly removeTransactionsByBatchId: (batchId: string) => void;
  readonly clear: () => void;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  transactions: [],

  addTransaction: (values) => {
    const transaction = mapFormValuesToStored(values);

    const autoCategoryId = transaction.categoryId
      ? undefined
      : autoCategorize(useRulesStore.getState().rules, [
          {
            id: transaction.id,
            description: transaction.description,
            categoryId: undefined,
          },
        ])[0]?.categoryId;
    const finalTransaction =
      autoCategoryId === undefined
        ? transaction
        : { ...transaction, categoryId: autoCategoryId };

    set((state) => ({
      transactions: [...state.transactions, finalTransaction],
    }));
    persistInBackground(transactionRepository.put(finalTransaction));

    return finalTransaction;
  },

  addTransactions: (rows) => {
    set((state) => ({
      transactions: [...state.transactions, ...rows],
    }));
    persistInBackground(transactionRepository.putMany(rows));
  },

  updateCategory: (id, categoryId) => {
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((tx) =>
      tx.id === id ? { ...tx, categoryId } : tx,
    );
    set({ transactions: next });
    const updated = next.find((tx) => tx.id === id);
    if (updated) {
      persistInBackground(transactionRepository.put(updated));
    }
  },

  bulkUpdateCategory: (ids, categoryId) => {
    const idSet = new Set(ids);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((tx) =>
      idSet.has(tx.id) ? { ...tx, categoryId } : tx,
    );
    set({ transactions: next });
    persistInBackground(
      transactionRepository.putMany(next.filter((tx) => idSet.has(tx.id))),
    );
  },

  assignBudget: (transactionIds, budgetId) => {
    const idSet = new Set(transactionIds);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((tx) =>
      idSet.has(tx.id) ? { ...tx, budgetId } : tx,
    );
    set({ transactions: next });
    persistInBackground(
      transactionRepository.putMany(next.filter((tx) => idSet.has(tx.id))),
    );
  },

  removeBudget: (transactionIds) => {
    const idSet = new Set(transactionIds);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((tx) =>
      idSet.has(tx.id) ? { ...tx, budgetId: undefined } : tx,
    );
    set({ transactions: next });
    persistInBackground(
      transactionRepository.putMany(next.filter((tx) => idSet.has(tx.id))),
    );
  },

  deleteTransactions: (ids) => {
    const idSet = new Set(ids);
    const current = useTransactionsStore.getState().transactions;
    set({ transactions: current.filter((tx) => !idSet.has(tx.id)) });
    idSet.forEach((id) => {
      persistInBackground(transactionRepository.delete(id));
    });
  },

  removeTransactionsByBatchId: (batchId) => {
    set((state) => ({
      transactions: state.transactions.filter(
        (transaction) => transaction.batchId !== batchId,
      ),
    }));
  },

  clear: () => {
    set({ transactions: [] });
    persistInBackground(transactionRepository.clear());
  },
}));
