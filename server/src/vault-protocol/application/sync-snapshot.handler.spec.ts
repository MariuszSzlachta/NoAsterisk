import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SyncSnapshotHandler } from './sync-snapshot.handler';
import { InMemorySyncSnapshotRepository } from '@vault-protocol/infrastructure/in-memory-sync-snapshot.repository';

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

describe('SyncSnapshotHandler', () => {
  it('returns opaque snapshots and maps CAS failures', async () => {
    const handler = new SyncSnapshotHandler(
      new InMemorySyncSnapshotRepository(),
    );
    await expect(
      handler.get('user-1', 'workspace-1', 'vault-1'),
    ).resolves.toEqual({ status: 'empty' });
    await expect(
      handler.put('user-1', 'workspace-1', snapshot, 0),
    ).resolves.toEqual({
      status: 'saved',
      revision: 1,
      envelopeHash: 'hash-1',
    });
    await expect(
      handler.put('user-1', 'workspace-1', { ...snapshot, revision: 2 }, 0),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      handler.put('user-2', 'workspace-1', { ...snapshot, revision: 2 }, 1),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
