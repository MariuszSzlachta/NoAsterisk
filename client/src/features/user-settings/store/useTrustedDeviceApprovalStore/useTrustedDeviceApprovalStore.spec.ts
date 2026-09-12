import { beforeEach, describe, expect, it } from 'vitest';

import { useTrustedDeviceApprovalStore } from '#features/user-settings/store/useTrustedDeviceApprovalStore';

describe('useTrustedDeviceApprovalStore', () => {
  beforeEach(() => useTrustedDeviceApprovalStore.getState().reset());
  it('clears stale errors when moving into a fresh wizard phase', () => {
    useTrustedDeviceApprovalStore.getState().setError('error');
    useTrustedDeviceApprovalStore.getState().setPhase({ kind: 'scanning' });
    expect(useTrustedDeviceApprovalStore.getState().phase).toEqual({
      kind: 'scanning',
    });
    expect(useTrustedDeviceApprovalStore.getState().error).toBeUndefined();
  });
  it('drops both response markup and errors on cancellation', () => {
    useTrustedDeviceApprovalStore
      .getState()
      .setPhase({ kind: 'response', markup: { __html: '<svg />' } });
    useTrustedDeviceApprovalStore.getState().setError('error');
    useTrustedDeviceApprovalStore.getState().reset();
    expect(useTrustedDeviceApprovalStore.getState().phase).toEqual({
      kind: 'idle',
    });
    expect(useTrustedDeviceApprovalStore.getState().error).toBeUndefined();
  });
});
