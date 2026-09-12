import { webcrypto } from 'node:crypto';
import { deviceSnapshotSignature } from './verify-device-snapshot-signature';

const header = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  keyId: 'key-1',
  formatVersion: 2,
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
  revision: 1,
  previousEnvelopeHash: '',
  createdByDeviceId: 'device-1',
  createdAt: '2026-09-12T00:00:00.000Z',
  nonce: 'AAAAAAAAAAAAAAAA',
};

const canonicalize = (value: Record<string, unknown>): string =>
  JSON.stringify(
    Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, value[key]]),
    ),
  );

describe('deviceSnapshotSignature', () => {
  it('verifies a device signature and rejects header substitution', async () => {
    const pair = await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    );
    const publicJwk = await webcrypto.subtle.exportKey('jwk', pair.publicKey);
    const ciphertext = 'opaque-ciphertext';
    const payload = new TextEncoder().encode(
      `budgetflow/snapshot-signature/v2|${canonicalize(header)}|${ciphertext}`,
    );
    const signature = await webcrypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      pair.privateKey,
      payload,
    );
    const snapshot = {
      vaultId: header.vaultId,
      keyId: header.keyId,
      deviceId: header.createdByDeviceId,
      revision: header.revision,
      previousEnvelopeHash: header.previousEnvelopeHash,
      header: JSON.stringify(header),
      ciphertext,
      signature: Buffer.from(signature).toString('base64'),
    };
    await expect(
      deviceSnapshotSignature.verify({
        signingPublicKey: JSON.stringify(publicJwk),
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        snapshot,
      }),
    ).resolves.toBe(true);
    await expect(
      deviceSnapshotSignature.verify({
        signingPublicKey: JSON.stringify(publicJwk),
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        snapshot: {
          ...snapshot,
          header: JSON.stringify({
            ...header,
            createdByDeviceId: 'other-device',
          }),
        },
      }),
    ).resolves.toBe(false);
  });
});
