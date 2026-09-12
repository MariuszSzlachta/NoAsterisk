import { describe, expect, it } from 'vitest';

import { buildSignedSyncFixture } from '#features/user-settings/api/synchronize-vault/testing/build-signed-sync-fixture';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';

describe('mapCreatedSnapshot', () => {
  it('should preserve authenticated envelope bytes and the current transport identity', async () => {
    const fixture = await buildSignedSyncFixture();
    try {
      expect(fixture.snapshot).toMatchObject({
        vaultId: fixture.material.context.vaultId,
        keyId: fixture.material.context.keyId,
        deviceId: fixture.material.context.deviceId,
      });
      await expect(
        opaqueSyncSnapshot.openEnvelope(
          {
            header: JSON.parse(fixture.snapshot.header),
            ciphertext: fixture.snapshot.ciphertext,
            signature: fixture.snapshot.signature,
          },
          fixture.material.context,
          fixture.material.syncKey,
          fixture.material.verifyKey,
          { revision: 0, envelopeHash: '' },
        ),
      ).resolves.toBe('{}');
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
