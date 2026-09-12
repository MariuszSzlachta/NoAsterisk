import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { hydrateUnlockedVault } from '#app/routing/useVaultUnlock/hydrate-unlocked-vault';
import { buildRemoteFixture } from '#app/routing/useVaultUnlock/prepare-enrollment-restore/testing/build-remote-fixture';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { apiClient } from '#shared/api';

afterEach(() => vi.restoreAllMocks());
describe('hydrateUnlockedVault', () => {
  it('should avoid remote restoration on a recognized complete profile and reject an inactive initialization', async () => {
    const fixture = await buildRemoteFixture();
    try {
      await encryptedPersistence.unlockWithVaultKeys(
        {
          ...(await vaultProtocol.deriveKeys(fixture.vmk, fixture.context)),
          vmk: fixture.vmk,
          requiresRemoteRestore: false,
        },
        fixture.context,
      );
      const read = vi.spyOn(apiClient, 'get');
      await hydrateUnlockedVault(() => true);
      expect(read).not.toHaveBeenCalled();
      await expect(hydrateUnlockedVault(() => false)).rejects.toThrow(
        'invalidated',
      );
      expect(read).not.toHaveBeenCalled();
    } finally {
      await fixture.dispose();
    }
  });
});
