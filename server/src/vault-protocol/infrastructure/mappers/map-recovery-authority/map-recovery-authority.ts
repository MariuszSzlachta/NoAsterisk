import { DomainError } from '@budget/domain';
import type { CurrentRecoveryRegistrationAuthority } from '@vault-protocol/domain/recovery-registration/types';
import type { RecoveryRegistrationAuthorityRow } from '@vault-protocol/infrastructure/recovery-registration/types';

export const mapRecoveryAuthorityRowToDomain = (
  row: RecoveryRegistrationAuthorityRow,
): CurrentRecoveryRegistrationAuthority => {
  if (row.signingPublicKey === null)
    throw new DomainError('Recovery authority registration is unavailable');
  return {
    protocolVersion: row.protocolVersion,
    cryptoSuite: row.cryptoSuite,
    userId: row.userId,
    workspaceId: row.workspaceId,
    vaultId: row.vaultId,
    keyId: row.keyId,
    deviceId: row.deviceId,
    signingPublicKey: row.signingPublicKey,
    recoveryPublicKey: row.recoveryPublicKey ?? undefined,
    deviceStatus: row.deviceStatus,
    isDeviceRevoked: row.isDeviceRevoked,
  };
};
