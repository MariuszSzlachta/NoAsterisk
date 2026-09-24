import { hexToBytes } from '@noble/curves/utils.js';
import { describe, expect, it } from 'vitest';

import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import {
  deriveRecoveryPublicKey,
  verifyRecoveryMessage,
} from '#shared/adapters/vault-protocol/recovery-authority';
import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
import { encodeRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/encode';
import { signRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/sign';

const snapshot: RotationTranscriptSnapshot = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  challenge: 'a'.repeat(43),
  expiresAt: '2026-09-13T09:00:00.000Z',
  currentRecoveryPublicKey: 'a'.repeat(64),
  nextRecoveryPublicKey: 'b'.repeat(64),
  signingPublicKey: '{"kty":"EC"}',
  envelopePurpose: 'device-wrap',
  envelope: 'opaque-envelope',
};

describe('signRotationTranscript', () => {
  it('signs identical canonical bytes with device and independent recovery roots', async () => {
    const device = await deviceSigningKey.generate();
    const recoverySeed = new Uint8Array(32).fill(7);
    try {
      const signed = await signRotationTranscript(
        snapshot,
        device.privateKey,
        recoverySeed,
      );
      const message = encodeRotationTranscript(snapshot);
      const devicePublicKey = await deviceSigningKey.exportPublicJwk(
        device.publicKey,
      );
      const imported = await deviceSigningKey.importPublicJwk(devicePublicKey);
      await expect(
        crypto.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          imported,
          hexToBytes(signed.deviceSignature),
          message,
        ),
      ).resolves.toBe(true);
      expect(
        verifyRecoveryMessage(
          deriveRecoveryPublicKey(recoverySeed),
          message,
          hexToBytes(signed.recoverySignature),
        ),
      ).toBe(true);
    } finally {
      recoverySeed.fill(0);
    }
  });

  it('does not sign a transcript with an invalid recovery seed', async () => {
    const device = await deviceSigningKey.generate();
    await expect(
      signRotationTranscript(snapshot, device.privateKey, new Uint8Array(31)),
    ).rejects.toThrow('Invalid recovery authority');
  });
});
