import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { isDuplicateClosure } from '#features/budgets/model/is-duplicate-closure';

// ─── State Interface ─────────────────────────────────────────────

interface PeriodHistoryState {
  readonly history: ReadonlyArray<PeriodHistoryRecord>;
  readonly addClosedPeriod: (record: PeriodHistoryRecord) => boolean;
}

// ─── Store ───────────────────────────────────────────────────────

export const usePeriodHistoryStore = create<PeriodHistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      /**
       * Adds a closed period record. Returns false and does nothing
       * if this period has already been closed (idempotency guard).
       */
      addClosedPeriod: (record) => {
        const currentHistory = get().history;

        if (isDuplicateClosure(record, currentHistory)) {
          return false;
        }

        set({ history: [...currentHistory, record] });
        return true;
      },
    }),
    {
      name: 'budget-period-history',
    },
  ),
);
