import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { StoredTransaction } from '#features/transactions/model/types';

// ─── State Interface ─────────────────────────────────────────────

interface TransactionsState {
  readonly transactions: ReadonlyArray<StoredTransaction>;
  readonly addTransactions: (rows: ReadonlyArray<StoredTransaction>) => void;
  readonly updateCategory: (id: string, categoryId: string | undefined) => void;
  readonly bulkUpdateCategory: (ids: ReadonlyArray<string>, categoryId: string) => void;
  readonly deleteTransactions: (ids: ReadonlyArray<string>) => void;
  readonly clear: () => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set) => ({
      transactions: [],

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
