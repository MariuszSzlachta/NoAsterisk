import { beforeEach, describe, expect, it } from 'vitest';

import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';

describe('vaultDeviceId', () => {
  beforeEach(() => localStorage.clear());

  it('creates and persists one browser-scoped id', () => {
    const first = vaultDeviceId.get();
    const second = vaultDeviceId.get();

    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
    expect(second).toBe(first);
    expect(localStorage.getItem('budgetflow:vault-v2:device-id')).toBe(first);
  });

  it('reuses a previously persisted id after a new module read', () => {
    localStorage.setItem('budgetflow:vault-v2:device-id', 'persisted-device');

    expect(vaultDeviceId.get()).toBe('persisted-device');
  });
});
