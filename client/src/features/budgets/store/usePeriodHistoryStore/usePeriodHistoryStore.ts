import { create } from 'zustand';

import { isDuplicateClosure } from '#features/budgets/model/is-duplicate-closure';
import { isPeriodHistoryRecord } from '#features/budgets/model/is-period-history-record';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const periodHistoryRepository = encryptedPersistence.repository<PeriodHistoryRecord>(
  'period-history',
  isPeriodHistoryRecord,
  (record) => record.id,
);

interface PeriodHistoryState {
  readonly history: ReadonlyArray<PeriodHistoryRecord>;
  readonly addClosedPeriod: (record: PeriodHistoryRecord) => boolean;
}

export const usePeriodHistoryStore = create<PeriodHistoryState>()((set, get) => ({
  history: [],

  addClosedPeriod: (record) => {
    const currentHistory = get().history;
    if (isDuplicateClosure(record, currentHistory)) {
      return false;
    }

    set({ history: [...currentHistory, record] });
    persistInBackground(periodHistoryRepository.put(record));
    return true;
  },
}));
