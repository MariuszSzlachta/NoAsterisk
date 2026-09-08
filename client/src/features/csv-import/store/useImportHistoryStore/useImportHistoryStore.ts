import { create } from 'zustand';

import { sortImportHistory } from '#features/csv-import/model/history/sort-import-history';
import type { ImportHistoryStoreState } from '#features/csv-import/store/useImportHistoryStore/types';

export const useImportHistoryStore = create<ImportHistoryStoreState>()(
  (set) => ({
    history: [],
    setHistory: (history) => set({ history: sortImportHistory(history) }),
    addRecord: (record) =>
      set((state) => ({
        history: sortImportHistory([
          ...state.history.filter((item) => item.batchId !== record.batchId),
          record,
        ]),
      })),
    removeRecord: (batchId) =>
      set((state) => ({
        history: state.history.filter((record) => record.batchId !== batchId),
      })),
  }),
);
