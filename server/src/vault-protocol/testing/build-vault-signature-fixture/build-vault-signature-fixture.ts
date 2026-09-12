import { ed25519 } from '@noble/curves/ed25519.js';
import { generateKeyPairSync, sign } from 'node:crypto';
import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture/types';

export const buildVaultSignatureFixture = (
  message: Uint8Array = new TextEncoder().encode('synthetic-vault-transcript'),
): VaultSignatureFixture => {
  const device = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const recoverySeed = Uint8Array.from({ length: 32 }, (_, index) => index);
  return {
    devicePrivateKey: device.privateKey,
    devicePublicKey: JSON.stringify(device.publicKey.export({ format: 'jwk' })),
    recoverySeed,
    recoveryPublicKey: Buffer.from(ed25519.getPublicKey(recoverySeed)).toString(
      'hex',
    ),
    message,
    deviceSignature: sign('sha256', message, {
      key: device.privateKey,
      dsaEncoding: 'ieee-p1363',
    }).toString('hex'),
    recoverySignature: Buffer.from(
      ed25519.sign(message, recoverySeed),
    ).toString('hex'),
  };
};
