import { syncSnapshotSchema } from './sync-snapshot.dto';

const valid = {
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
  revision: 1,
  previousEnvelopeHash: '',
  envelopeHash: 'hash-1',
  header: '{}',
  ciphertext: 'opaque-ciphertext',
  signature: 'signature',
  signingPublicKey: '{"kty":"EC","crv":"P-256","x":"public-x","y":"public-y"}',
  createdAt: '2026-09-11T00:00:00.000Z',
};

describe('syncSnapshotSchema', () => {
  it('accepts only opaque, bounded protocol metadata', () => {
    expect(syncSnapshotSchema.safeParse(valid).success).toBe(true);
    expect(
      syncSnapshotSchema.safeParse({ ...valid, plaintext: 'secret' }).success,
    ).toBe(false);
    expect(
      syncSnapshotSchema.safeParse({ ...valid, revision: 1.5 }).success,
    ).toBe(false);
    expect(
      syncSnapshotSchema.safeParse({ ...valid, createdAt: 'invalid' }).success,
    ).toBe(false);
  });
});
