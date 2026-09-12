import { create } from 'zustand';

import type { RecoveryBackupUpgradeState } from '#features/user-settings/model/recovery-backup-upgrade/types';

export const useRecoveryBackupUpgradeStore = create<RecoveryBackupUpgradeState>(
  (set) => ({
    phase: 'idle',
    setPhase: (phase) => set({ phase }),
    reset: () => set({ phase: 'idle' }),
  }),
);
