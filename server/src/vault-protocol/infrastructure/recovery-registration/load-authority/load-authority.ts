import { and, eq } from 'drizzle-orm';
import {
  vaultDevices,
  vaultKeysets,
  vaults,
} from '@shared/infrastructure/database/schema';
import type { RecoveryRegistrationScope } from '@vault-protocol/domain/recovery-registration/types';
import type {
  RecoveryRegistrationAuthorityRow,
  RecoveryRegistrationTransaction,
} from '@vault-protocol/infrastructure/recovery-registration/types';

export const loadRecoveryRegistrationAuthority = async (
  transaction: RecoveryRegistrationTransaction,
  scope: RecoveryRegistrationScope,
): Promise<RecoveryRegistrationAuthorityRow | undefined> => {
  const rows = await transaction
    .select({
      keysetId: vaultKeysets.id,
      protocolVersion: vaultKeysets.protocolVersion,
      cryptoSuite: vaultKeysets.cryptoSuite,
      userId: vaultDevices.userId,
      workspaceId: vaults.workspaceId,
      vaultId: vaults.id,
      keyId: vaultKeysets.keyId,
      deviceId: vaultDevices.deviceId,
      signingPublicKey: vaultDevices.signingPublicKey,
      recoveryPublicKey: vaultKeysets.recoveryPublicKey,
      deviceStatus: vaultDevices.status,
      isDeviceRevoked: vaultDevices.revoked,
    })
    .from(vaultDevices)
    .innerJoin(vaultKeysets, eq(vaultKeysets.id, vaultDevices.keysetId))
    .innerJoin(vaults, eq(vaults.id, vaultKeysets.vaultId))
    .where(
      and(
        eq(vaultDevices.userId, scope.userId),
        eq(vaults.workspaceId, scope.workspaceId),
        eq(vaults.id, scope.vaultId),
        eq(vaultKeysets.keyId, scope.keyId),
        eq(vaultDevices.deviceId, scope.deviceId),
      ),
    )
    .limit(1);
  return rows[0];
};
