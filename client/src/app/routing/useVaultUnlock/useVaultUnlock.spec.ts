import { describe, expect, it } from 'vitest';
import { vaultUnlockPolicy } from '#app/routing/useVaultUnlock/vault-unlock-policy';
import { shouldResetVaultUnlockAttempt } from '#app/routing/useVaultUnlock/vault-unlock-state';

describe('Vault unlock bootstrap policy', () => {
  it('allows a high-security bootstrap without a device envelope', () => {
    const bootstrap = {
      status: 'available',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: '{"header":{},"ciphertext":"opaque"}',
    };

    expect(vaultUnlockPolicy.isHighSecurityBootstrap(bootstrap)).toBe(true);
    expect(vaultUnlockPolicy.canFallbackToDeviceEnvelope(bootstrap)).toBe(false);
  });

  it('does not treat a failed PRF ceremony as a standard unlock', () => {
    const bootstrap = {
      status: 'available',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: '{"header":{},"ciphertext":"opaque"}',
      deviceEnvelope: '{"header":{},"ciphertext":"stale"}',
    };
    expect(vaultUnlockPolicy.isHighSecurityBootstrap(bootstrap)).toBe(false);
    expect(vaultUnlockPolicy.canFallbackToDeviceEnvelope(bootstrap)).toBe(true);
  });

  it('fails closed when the server declares high-security even if a stale device envelope exists', () => {
    const bootstrap = {
      deviceEnvelope: 'stale-device-envelope',
      passkeyEnvelope: 'passkey-envelope',
      securityProfile: 'high-security',
    };

    expect(vaultUnlockPolicy.isHighSecurityBootstrap(bootstrap)).toBe(true);
    expect(vaultUnlockPolicy.canFallbackToDeviceEnvelope(bootstrap)).toBe(false);
  });

  it('resets the automatic attempt only when the account context changes', () => {
    expect(
      shouldResetVaultUnlockAttempt('account-1:workspace-1', 'account-1:workspace-1'),
    ).toBe(false);
    expect(
      shouldResetVaultUnlockAttempt('account-1:workspace-1', 'account-2:workspace-1'),
    ).toBe(true);
  });
});
