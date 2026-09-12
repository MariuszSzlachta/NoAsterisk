import { InMemorySyncSnapshotRepository } from './in-memory-sync-snapshot.repository';

const snapshot = {
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
  revision: 1,
  previousEnvelopeHash: '',
  envelopeHash: 'hash-1',
  header: '{}',
  ciphertext: 'ciphertext-only',
  signature: 'signature',
  signingPublicKey: '{"kty":"EC","crv":"P-256","x":"public-x","y":"public-y"}',
  createdAt: '2026-09-11T00:00:00.000Z',
};

describe('InMemorySyncSnapshotRepository', () => {
  it('enforces CAS and workspace ownership', async () => {
    const repository = new InMemorySyncSnapshotRepository();
    await expect(
      repository.saveIfCurrent('user-1', 'workspace-1', snapshot, 0),
    ).resolves.toBe('saved');
    await expect(
      repository.saveIfCurrent(
        'user-1',
        'workspace-1',
        { ...snapshot, revision: 2 },
        0,
      ),
    ).resolves.toBe('conflict');
    await expect(
      repository.saveIfCurrent(
        'user-2',
        'workspace-1',
        { ...snapshot, revision: 2 },
        1,
      ),
    ).resolves.toBe('forbidden');
    await expect(
      repository.findLatest('user-1', 'workspace-1', 'vault-1'),
    ).resolves.toEqual(snapshot);
  });
});
