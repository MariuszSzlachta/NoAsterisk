import type { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import type { RecoveryRegistrationView } from '@vault-protocol/application/mappers/map-recovery-registration-response/types';

export const mapRecoveryRegistrationToResponse = (
  registration: RecoveryAuthorityRegistration,
): RecoveryRegistrationView => ({
  accountId: registration.snapshot.userId,
  workspaceId: registration.snapshot.workspaceId,
  vaultId: registration.snapshot.vaultId,
  keyId: registration.snapshot.keyId,
  deviceId: registration.snapshot.deviceId,
  challenge: registration.snapshot.challenge,
  expiresAt: new Date(registration.snapshot.expiresAt).toISOString(),
  signingPublicKey: registration.snapshot.signingPublicKey,
  recoveryPublicKey: registration.snapshot.recoveryPublicKey,
});
