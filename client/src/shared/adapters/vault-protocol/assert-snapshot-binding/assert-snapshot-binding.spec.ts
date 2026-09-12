import { describe, expect, it } from 'vitest';

import { assertSnapshotBinding } from '#shared/adapters/vault-protocol/assert-snapshot-binding';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

const buildSnapshot = async () => {
  const context = {
    accountId: 'test-account',
    workspaceId: 'test-workspace',
    vaultId: 'test-vault',
    keyId: 'test-key',
    deviceId: 'test-device',
  };
  const vmk = vaultProtocol.generateVmk();
  try {
    const keys = await vaultProtocol.deriveKeys(vmk, context);
    const signing = await deviceSigningKey.generate();
    const snapshot = await opaqueSyncSnapshot.create({
      plaintext: 'fixture',
      context,
      revision: 1,
      previousEnvelopeHash: '',
      syncKey: keys.sync,
      signingKey: signing.privateKey,
    });
    return {
      envelope: snapshot.envelope,
      metadata: {
        vaultId: context.vaultId,
        keyId: context.keyId,
        deviceId: context.deviceId,
        revision: 1,
        previousEnvelopeHash: '',
        envelopeHash: snapshot.state.envelopeHash,
        createdAt: snapshot.envelope.header.createdAt,
      },
    };
  } finally {
    vmk.fill(0);
  }
};

describe('assertSnapshotBinding', () => {
  it('should accept metadata when it matches the authenticated envelope', async () => {
    const { envelope, metadata } = await buildSnapshot();
    await expect(
      assertSnapshotBinding(envelope, metadata),
    ).resolves.toBeUndefined();
  });
  it.each([
    'vaultId',
    'keyId',
    'deviceId',
    'previousEnvelopeHash',
    'createdAt',
  ])(
    'should reject a changed %s before acknowledging restore',
    async (field) => {
      const { envelope, metadata } = await buildSnapshot();
      await expect(
        assertSnapshotBinding(envelope, { ...metadata, [field]: 'changed' }),
      ).rejects.toThrow('metadata mismatch');
    },
  );
  it('should reject an advertised revision when it differs from the signed revision', async () => {
    const { envelope, metadata } = await buildSnapshot();
    await expect(
      assertSnapshotBinding(envelope, { ...metadata, revision: 999 }),
    ).rejects.toThrow('metadata mismatch');
  });
  it('should reject an advertised hash when it differs from the computed hash', async () => {
    const { envelope, metadata } = await buildSnapshot();
    await expect(
      assertSnapshotBinding(envelope, { ...metadata, envelopeHash: 'forged' }),
    ).rejects.toThrow('hash mismatch');
  });
  it('should reject malformed input instead of hashing an arbitrary transport object', async () => {
    const { metadata } = await buildSnapshot();
    await expect(assertSnapshotBinding({}, metadata)).rejects.toThrow(
      'Invalid snapshot',
    );
  });
});
