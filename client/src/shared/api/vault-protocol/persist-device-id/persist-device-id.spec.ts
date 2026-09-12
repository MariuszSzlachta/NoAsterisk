import { afterEach, describe, expect, it, vi } from 'vitest';

import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';
import { persistVaultDeviceId } from '#shared/api/vault-protocol/persist-device-id';

afterEach(() => vi.restoreAllMocks());
describe('persistVaultDeviceId', () => {
  it('should remember a replacement identity for the next bootstrap', () => {
    const replacement = crypto.randomUUID();
    persistVaultDeviceId(replacement);
    expect(vaultDeviceId.get()).toBe(replacement);
  });
  it.each(['', 'a'.repeat(129)])(
    'should reject invalid identities without modifying storage',
    (identity) => {
      const original = vaultDeviceId.get();
      expect(() => persistVaultDeviceId(identity)).toThrow();
      expect(vaultDeviceId.get()).toBe(original);
    },
  );
});
