import { beforeEach, describe, expect, it } from 'vitest';

import { useRecoveryBackupUpgradeStore } from '#features/user-settings/store/useRecoveryBackupUpgradeStore';

beforeEach(() => useRecoveryBackupUpgradeStore.getState().reset());
describe('useRecoveryBackupUpgradeStore', () => {
  it('should clear operation state without retaining backup contents', () => {
    const store = useRecoveryBackupUpgradeStore.getState();
    store.setPhase('working');
    expect(useRecoveryBackupUpgradeStore.getState().phase).toBe('working');
    store.setPhase('failed');
    store.reset();
    expect(useRecoveryBackupUpgradeStore.getState().phase).toBe('idle');
    store.setPhase('completed');
    store.reset();
    expect(useRecoveryBackupUpgradeStore.getState().phase).toBe('idle');
  });
});
