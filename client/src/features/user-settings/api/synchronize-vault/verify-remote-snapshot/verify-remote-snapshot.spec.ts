import { describe, expect, it } from 'vitest';

import { buildSignedSyncFixture } from '#features/user-settings/api/synchronize-vault/testing/build-signed-sync-fixture';
import { verifyRemoteSnapshot } from '#features/user-settings/api/synchronize-vault/verify-remote-snapshot';

describe('verifyRemoteSnapshot', () => {
  it('should authenticate the native encrypted snapshot and reject missing watermarks, tampering and cancellation', async () => {
    const fixture = await buildSignedSyncFixture();
    try {
      const metadata = {
        observedRevision: fixture.snapshot.revision,
        highWaterEnvelopeHash: fixture.snapshot.envelopeHash,
      };
      await expect(
        verifyRemoteSnapshot(
          fixture.snapshot,
          fixture.material,
          false,
          metadata,
          () => {},
        ),
      ).resolves.toBeUndefined();
      await expect(
        verifyRemoteSnapshot(
          fixture.snapshot,
          fixture.material,
          false,
          { observedRevision: undefined, highWaterEnvelopeHash: undefined },
          () => {},
        ),
      ).rejects.toThrow('high-water');
      await expect(
        verifyRemoteSnapshot(
          { ...fixture.snapshot, ciphertext: 'tampered' },
          fixture.material,
          true,
          metadata,
          () => {},
        ),
      ).rejects.toThrow();
      await expect(
        verifyRemoteSnapshot(
          fixture.snapshot,
          fixture.material,
          false,
          metadata,
          () => {
            throw new Error('Cancelled');
          },
        ),
      ).rejects.toThrow('Cancelled');
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
