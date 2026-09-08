import { create } from 'zustand';

// ARCH-EXCEPTION: cross-feature import — auto-categorize must read rules to assign category
// to new manual transactions. Same pattern as useApplyRules hook — accepted permanently.
import { autoCategorize, useRulesStore } from '#features/admin-rules';
import { mapFormValuesToStored } from '#features/transactions/model/create-transaction/map-form-values-to-stored';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { CreateTransactionFormValues } from '#features/transactions/model/create-transaction/types';
import type { StoredTransaction } from '#features/transactions/model/types';
import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const transactionRepository = encryptedPersistence.repository<StoredTransaction>(
  'transactions',
  isStoredTransaction,
  (record) => record.id,
);

interface TransactionsState {
  readonly transactions: ReadonlyArray<StoredTransaction>;
  readonly addTransaction: (values: CreateTransactionFormValues) => StoredTransaction;
  readonly addTransactions: (rows: ReadonlyArray<StoredTransaction>) => void;
  readonly updateCategory: (id: string, categoryId: string | undefined) => void;
  readonly bulkUpdateCategory: (ids: ReadonlyArray<string>, categoryId: string) => void;
  readonly assignBudget: (transactionIds: ReadonlyArray<string>, budgetId: string) => void;
  readonly removeBudget: (transactionIds: ReadonlyArray<string>) => void;
  readonly deleteTransactions: (ids: ReadonlyArray<string>) => void;
  readonly clear: () => void;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  transactions: [],

  addTransaction: (values) => {
    const transaction = mapFormValuesToStored(values);

    // Auto-categorize: if no category was selected, try to match a rule
    let finalTransaction = transaction;
    if (!transaction.categoryId) {
      const rules = useRulesStore.getState().rules;
      const results = autoCategorize(rules, [
        { id: transaction.id, description: transaction.description, categoryId: undefined },
      ]);
      if (results.length > 0) {
        const result = results[0];
        if (result) {
          finalTransaction = { ...transaction, categoryId: result.categoryId };
        }
      }
    }

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
    const next = current.map((tx) => (tx.id === id ? { ...tx, categoryId } : tx));
    set({ transactions: next });
    const updated = next.find((tx) => tx.id === id);
    if (updated) {
      persistInBackground(transactionRepository.put(updated));
    }
  },

  bulkUpdateCategory: (ids, categoryId) => {
    const idSet = new Set(ids);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((tx) => (idSet.has(tx.id) ? { ...tx, categoryId } : tx));
    set({ transactions: next });
    persistInBackground(transactionRepository.putMany(next.filter((tx) => idSet.has(tx.id))));
  },

  assignBudget: (transactionIds, budgetId) => {
    const idSet = new Set(transactionIds);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((tx) => (idSet.has(tx.id) ? { ...tx, budgetId } : tx));
    set({ transactions: next });
    persistInBackground(transactionRepository.putMany(next.filter((tx) => idSet.has(tx.id))));
  },

  removeBudget: (transactionIds) => {
    const idSet = new Set(transactionIds);
    const current = useTransactionsStore.getState().transactions;
    const next = current.map((tx) =>
      idSet.has(tx.id) ? { ...tx, budgetId: undefined } : tx,
    );
    set({ transactions: next });
    persistInBackground(transactionRepository.putMany(next.filter((tx) => idSet.has(tx.id))));
  },

  deleteTransactions: (ids) => {
    const idSet = new Set(ids);
    const current = useTransactionsStore.getState().transactions;
    set({ transactions: current.filter((tx) => !idSet.has(tx.id)) });
    idSet.forEach((id) => {
      persistInBackground(transactionRepository.delete(id));
    });
  },

  clear: () => {
    set({ transactions: [] });
    persistInBackground(transactionRepository.clear());
  },
}));
