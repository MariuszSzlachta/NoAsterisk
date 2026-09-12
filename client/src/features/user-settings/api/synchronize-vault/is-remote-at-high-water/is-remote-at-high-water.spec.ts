import { describe, expect, it } from 'vitest';

import { isRemoteAtHighWater } from '#features/user-settings/api/synchronize-vault/is-remote-at-high-water';
import { buildSignedSyncFixture } from '#features/user-settings/api/synchronize-vault/testing/build-signed-sync-fixture';

describe('isRemoteAtHighWater', () => {
  it('should require both the exact revision and authenticated hash', async () => {
    const fixture = await buildSignedSyncFixture();
    try {
      const metadata = {
        observedRevision: fixture.snapshot.revision,
        highWaterEnvelopeHash: fixture.snapshot.envelopeHash,
      };
      expect(isRemoteAtHighWater(fixture.snapshot, metadata)).toBe(true);
      expect(
        isRemoteAtHighWater(fixture.snapshot, {
          ...metadata,
          observedRevision: undefined,
        }),
      ).toBe(false);
      expect(
        isRemoteAtHighWater(fixture.snapshot, {
          ...metadata,
          highWaterEnvelopeHash: undefined,
        }),
      ).toBe(false);
      expect(
        isRemoteAtHighWater(fixture.snapshot, {
          ...metadata,
          observedRevision: metadata.observedRevision + 1,
        }),
      ).toBe(false);
      expect(
        isRemoteAtHighWater(fixture.snapshot, {
          ...metadata,
          highWaterEnvelopeHash: 'foreign',
        }),
      ).toBe(false);
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
