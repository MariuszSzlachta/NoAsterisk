import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PeriodHistoryRecord } from '#features/budgets/model/period-history';

// ─── State Interface ─────────────────────────────────────────────

interface PeriodHistoryState {
  readonly history: ReadonlyArray<PeriodHistoryRecord>;
  readonly addClosedPeriod: (record: PeriodHistoryRecord) => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const usePeriodHistoryStore = create<PeriodHistoryState>()(
  persist(
    (set) => ({
      history: [],

      addClosedPeriod: (record) =>
        set((state) => ({
          history: [...state.history, record],
        })),
    }),
    {
      name: 'budget-period-history',
    },
  ),
);
