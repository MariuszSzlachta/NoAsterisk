import { create } from 'zustand';

import type { TrustedDeviceApprovalState } from '#features/user-settings/model/trusted-device-approval/types';

export const useTrustedDeviceApprovalStore = create<TrustedDeviceApprovalState>(
  (set) => ({
    phase: { kind: 'idle' },
    error: undefined,
    setPhase: (phase) => set({ phase, error: undefined }),
    setError: (error) => set({ error }),
    reset: () => set({ phase: { kind: 'idle' }, error: undefined }),
  }),
);
