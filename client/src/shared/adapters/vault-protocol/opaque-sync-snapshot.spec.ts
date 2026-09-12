import { describe, expect, it } from 'vitest';

import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { vaultProtocol } from '#shared/adapters/vault-protocol';

const context = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
};

const createMaterial = async (): Promise<{
  readonly syncKey: CryptoKey;
  readonly signingKey: CryptoKey;
  readonly verifyKey: CryptoKey;
}> => {
  const keys = await vaultProtocol.deriveKeys(vaultProtocol.generateVmk(), context);
  const signingKeys = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify'],
  );
  return {
    syncKey: keys.sync,
    signingKey: signingKeys.privateKey,
    verifyKey: signingKeys.publicKey,
  };
};

describe('opaque sync snapshot', () => {
  it('creates and opens a signed encrypted transport envelope', async () => {
    const material = await createMaterial();
    const created = await opaqueSyncSnapshot.create({
      plaintext: JSON.stringify({ transactions: [{ id: 'tx-1' }] }),
      context,
      revision: 1,
      previousEnvelopeHash: '',
      ...material,
    });

    await expect(
      opaqueSyncSnapshot.open(
        created.transport,
        context,
        material.syncKey,
        material.verifyKey,
        { revision: 0, envelopeHash: '' },
      ),
    ).resolves.toContain('tx-1');
  });

  it('rejects tampered, replayed, oversized and malformed transports', async () => {
    const material = await createMaterial();
    const created = await opaqueSyncSnapshot.create({
      plaintext: '{}',
      context,
      revision: 2,
      previousEnvelopeHash: 'previous',
      ...material,
    });

    await expect(
      opaqueSyncSnapshot.open(
        `${created.transport.slice(0, -2)}AA`,
        context,
        material.syncKey,
        material.verifyKey,
        { revision: 0, envelopeHash: '' },
      ),
    ).rejects.toThrow();
    await expect(
      opaqueSyncSnapshot.open(
        created.transport,
        context,
        material.syncKey,
        material.verifyKey,
        { revision: 1, envelopeHash: 'different' },
      ),
    ).rejects.toThrow('Snapshot chain mismatch');
    await expect(
      opaqueSyncSnapshot.open(
        'e30=',
        context,
        material.syncKey,
        material.verifyKey,
        { revision: 0, envelopeHash: '' },
      ),
    ).rejects.toThrow();
  });

  it('verifies a snapshot from another device with the sender public key', async () => {
    const vmk = vaultProtocol.generateVmk();
    const sharedKeys = await vaultProtocol.deriveKeys(vmk, {
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      keyId: context.keyId,
    });
    const sender = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign', 'verify'],
    );
    const otherDevice = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign', 'verify'],
    );
    try {
      const created = await opaqueSyncSnapshot.create({
        plaintext: JSON.stringify({ device: 'device-2' }),
        context: { ...context, deviceId: 'device-2' },
        revision: 1,
        previousEnvelopeHash: '',
        syncKey: sharedKeys.sync,
        signingKey: otherDevice.privateKey,
      });

      await expect(
        opaqueSyncSnapshot.openEnvelope(
          created.envelope,
          {
            accountId: context.accountId,
            workspaceId: context.workspaceId,
            vaultId: context.vaultId,
            keyId: context.keyId,
          },
          sharedKeys.sync,
          otherDevice.publicKey,
          { revision: 0, envelopeHash: '' },
        ),
      ).resolves.toContain('device-2');
      await expect(
        opaqueSyncSnapshot.openEnvelope(
          created.envelope,
          {
            accountId: context.accountId,
            workspaceId: context.workspaceId,
            vaultId: context.vaultId,
            keyId: context.keyId,
          },
          sharedKeys.sync,
          sender.publicKey,
          { revision: 0, envelopeHash: '' },
        ),
      ).rejects.toThrow('Snapshot signature verification failed');
    } finally {
      vmk.fill(0);
    }
  });
});
