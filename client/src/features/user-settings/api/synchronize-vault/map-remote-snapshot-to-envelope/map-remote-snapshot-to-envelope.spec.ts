import { describe, expect, it } from 'vitest';

import { mapRemoteSnapshotToEnvelope } from '#features/user-settings/api/synchronize-vault/map-remote-snapshot-to-envelope';
import { buildSignedSyncFixture } from '#features/user-settings/api/synchronize-vault/testing/build-signed-sync-fixture';

describe('mapRemoteSnapshotToEnvelope', () => {
  it('should reconstruct the signed envelope and reject malformed header JSON', async () => {
    const fixture = await buildSignedSyncFixture();
    try {
      expect(mapRemoteSnapshotToEnvelope(fixture.snapshot)).toEqual(
        fixture.created.envelope,
      );
      expect(() =>
        mapRemoteSnapshotToEnvelope({ ...fixture.snapshot, header: '{' }),
      ).toThrow();
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
