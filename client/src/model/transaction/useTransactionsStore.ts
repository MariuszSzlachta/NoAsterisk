import { create } from 'zustand';

import { autoCategorize, useRulesStore } from '#model/rule';
import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import { TRANSACTIONS_COLLECTION } from '#shared/adapters/persistence/ports';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

import { isStoredTransaction } from './is-stored-transaction';
import { mapFormValuesToStored } from './map-form-values-to-stored';
import type { CreateTransactionFormValues, StoredTransaction } from './types';

const transactionRepository = encryptedPersistence.repository<StoredTransaction>(
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
      : autoCategorize(useRulesStore.getState().rules, [transaction])[0]
          ?.categoryId;
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
    set((state) => ({ transactions: [...state.transactions, ...rows] }));
    persistInBackground(transactionRepository.putMany(rows));
  },

  updateCategory: (id, categoryId) => {
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((transaction) =>
      transaction.id === id ? { ...transaction, categoryId } : transaction,
    );
    set({ transactions: next });
    const updated = next.find((transaction) => transaction.id === id);
    if (updated !== undefined) {
      persistInBackground(transactionRepository.put(updated));
    }
  },

  bulkUpdateCategory: (ids, categoryId) => {
    const idSet = new Set(ids);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((transaction) =>
      idSet.has(transaction.id) ? { ...transaction, categoryId } : transaction,
    );
    set({ transactions: next });
    persistInBackground(
      transactionRepository.putMany(
        next.filter((transaction) => idSet.has(transaction.id)),
      ),
    );
  },

  assignBudget: (transactionIds, budgetId) => {
    const idSet = new Set(transactionIds);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((transaction) =>
      idSet.has(transaction.id) ? { ...transaction, budgetId } : transaction,
    );
    set({ transactions: next });
    persistInBackground(
      transactionRepository.putMany(
        next.filter((transaction) => idSet.has(transaction.id)),
      ),
    );
  },

  removeBudget: (transactionIds) => {
    const idSet = new Set(transactionIds);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((transaction) =>
      idSet.has(transaction.id)
        ? { ...transaction, budgetId: undefined }
        : transaction,
    );
    set({ transactions: next });
    persistInBackground(
      transactionRepository.putMany(
        next.filter((transaction) => idSet.has(transaction.id)),
      ),
    );
  },

  deleteTransactions: (ids) => {
    const idSet = new Set(ids);
    const current = useTransactionsStore.getState().transactions;
    set({
      transactions: current.filter((transaction) => !idSet.has(transaction.id)),
    });
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
