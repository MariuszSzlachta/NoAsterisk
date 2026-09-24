import { ed25519 } from '@noble/curves/ed25519.js';
import { sign } from 'node:crypto';
import type { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';
import type { FinalizeDualRootRotationCommand } from '@vault-protocol/application/commands/finalize-dual-root-rotation/types';
export const signVaultRotation = (
  transcript: VaultRotationTranscript,
  fixture: VaultSignatureFixture,
): FinalizeDualRootRotationCommand => ({
  user: {
    userId: transcript.snapshot.accountId,
    workspaceId: transcript.snapshot.workspaceId,
    role: 'Member',
    amr: 'password',
    authTime: Date.now(),
  },
  transcript: transcript.snapshot,
  deviceSignature: sign('sha256', transcript.toSigningBytes(), {
    key: fixture.devicePrivateKey,
    dsaEncoding: 'ieee-p1363',
  }).toString('hex'),
  recoverySignature: Buffer.from(
    ed25519.sign(transcript.toSigningBytes(), fixture.recoverySeed),
  ).toString('hex'),
});
