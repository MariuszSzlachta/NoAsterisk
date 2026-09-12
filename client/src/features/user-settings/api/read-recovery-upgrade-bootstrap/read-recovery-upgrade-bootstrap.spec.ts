import { afterEach, describe, expect, it, vi } from 'vitest';

import { readRecoveryUpgradeBootstrap } from '#features/user-settings/api/read-recovery-upgrade-bootstrap';
import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';
import { apiClient } from '#shared/api';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';
import { buildVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/testing/build-vault-bootstrap-metadata';

afterEach(() => vi.restoreAllMocks());
describe('readRecoveryUpgradeBootstrap', () => {
  it('rejects a foreign vault instead of accepting its recovery authority', async () => {
    const context = buildRecoveryRegistrationIntent({
      deviceId: vaultDeviceId.get(),
    });
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      buildVaultBootstrapMetadata({
        vaultId: crypto.randomUUID(),
        keyId: context.keyId,
        deviceId: context.deviceId,
      }),
    );
    await expect(
      readRecoveryUpgradeBootstrap(
        context,
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow('Recovery upgrade unavailable');
  });
  it('rejects a response after the operation has been invalidated', async () => {
    const context = buildRecoveryRegistrationIntent({
      deviceId: vaultDeviceId.get(),
    });
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      buildVaultBootstrapMetadata({
        vaultId: context.vaultId,
        keyId: context.keyId,
        deviceId: context.deviceId,
      }),
    );
    await expect(
      readRecoveryUpgradeBootstrap(
        context,
        new AbortController().signal,
        () => {
          throw new Error('Cancelled');
        },
      ),
    ).rejects.toThrow('Cancelled');
  });
});
