import { ed25519 } from '@noble/curves/ed25519.js';
import { sign } from 'node:crypto';
import type { ConfirmRecoveryRegistrationCommand } from '@vault-protocol/application/commands/confirm-recovery-registration';
import type { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';

export const signRecoveryRegistration = (
  registration: RecoveryAuthorityRegistration,
  fixture: VaultSignatureFixture,
): ConfirmRecoveryRegistrationCommand => ({
  user: {
    userId: registration.snapshot.userId,
    workspaceId: registration.snapshot.workspaceId,
    role: 'Member',
    authTime: Date.now(),
    amr: 'password',
  },
  vaultId: registration.snapshot.vaultId,
  keyId: registration.snapshot.keyId,
  deviceId: registration.snapshot.deviceId,
  challenge: registration.snapshot.challenge,
  deviceSignature: sign('sha256', registration.toSigningBytes(), {
    key: fixture.devicePrivateKey,
    dsaEncoding: 'ieee-p1363',
  }).toString('hex'),
  recoverySignature: Buffer.from(
    ed25519.sign(registration.toSigningBytes(), fixture.recoverySeed),
  ).toString('hex'),
});
