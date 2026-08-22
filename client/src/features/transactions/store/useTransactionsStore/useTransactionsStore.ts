import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ARCH-EXCEPTION: cross-feature import — auto-categorize must read rules to assign category
// to new manual transactions. Same pattern as useApplyRules hook — accepted permanently.
import { autoCategorize, useRulesStore } from '#features/admin-rules';
import { mapFormValuesToStored } from '#features/transactions/model/create-transaction/map-form-values-to-stored';
import type { CreateTransactionFormValues } from '#features/transactions/model/create-transaction/types';
import type { StoredTransaction } from '#features/transactions/model/types';

// ─── State Interface ─────────────────────────────────────────────

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

// ─── Store ───────────────────────────────────────────────────────

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set) => ({
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
            finalTransaction = { ...transaction, categoryId: results[0].categoryId };
          }
        }

        set((state) => ({
          transactions: [...state.transactions, finalTransaction],
        }));

        return finalTransaction;
      },

      addTransactions: (rows) =>
        set((state) => ({
          transactions: [...state.transactions, ...rows],
        })),

      updateCategory: (id, categoryId) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, categoryId } : tx,
          ),
        })),

      bulkUpdateCategory: (ids, categoryId) =>
        set((state) => {
          const idSet = new Set(ids);
          return {
            transactions: state.transactions.map((tx) =>
              idSet.has(tx.id) ? { ...tx, categoryId } : tx,
            ),
          };
        }),

      assignBudget: (transactionIds, budgetId) =>
        set((state) => {
          const idSet = new Set(transactionIds);
          return {
            transactions: state.transactions.map((tx) =>
              idSet.has(tx.id) ? { ...tx, budgetId } : tx,
            ),
          };
        }),

      removeBudget: (transactionIds) =>
        set((state) => {
          const idSet = new Set(transactionIds);
          return {
            transactions: state.transactions.map((tx) =>
              idSet.has(tx.id) ? { ...tx, budgetId: undefined } : tx,
            ),
          };
        }),

      deleteTransactions: (ids) =>
        set((state) => {
          const idSet = new Set(ids);
          return {
            transactions: state.transactions.filter((tx) => !idSet.has(tx.id)),
          };
        }),

      clear: () => set({ transactions: [] }),
    }),
    {
      name: 'budget-transactions',
    },
  ),
);
