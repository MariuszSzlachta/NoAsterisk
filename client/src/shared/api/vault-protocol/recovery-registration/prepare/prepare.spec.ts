import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';
import { apiClient } from '#shared/api';
import { prepareRecoveryRegistration } from '#shared/api/vault-protocol/recovery-registration/prepare';

afterEach(() => vi.restoreAllMocks());
describe('prepareRecoveryRegistration', () => {
  it('should send only public scope and acknowledged backup possession', async () => {
    const intent = buildRecoveryRegistrationIntent();
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(intent);
    const signal = new AbortController().signal;
    expect(await prepareRecoveryRegistration(intent, signal)).toEqual(intent);
    expect(post).toHaveBeenCalledWith(
      '/users/me/vault/recovery-authority/prepare',
      {
        vaultId: 'vault',
        keyId: 'key',
        deviceId: 'device',
        recoveryPublicKey: 'a'.repeat(64),
        recoveryConfirmed: true,
      },
      { signal },
    );
  });
  it.each(['foreign-context', 'expired', 'private-field'])(
    'should reject %s before signing',
    async (failure) => {
      const intent = buildRecoveryRegistrationIntent();
      vi.spyOn(apiClient, 'post').mockResolvedValue(
        failure === 'foreign-context'
          ? { ...intent, workspaceId: 'foreign' }
          : failure === 'expired'
            ? { ...intent, expiresAt: new Date(0).toISOString() }
            : { ...intent, vmk: 'secret' },
      );
      await expect(
        prepareRecoveryRegistration(intent, new AbortController().signal),
      ).rejects.toThrow();
    },
  );
});
