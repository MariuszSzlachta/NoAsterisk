import type { vaultRecoveryAuthorityChallenges } from '@shared/infrastructure/database/schema';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';

export const mapRecoveryRegistrationRowToDomain = (
  row: typeof vaultRecoveryAuthorityChallenges.$inferSelect,
): RecoveryAuthorityRegistration =>
  new RecoveryAuthorityRegistration({
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    vaultId: row.vaultId,
    keyId: row.keyId,
    deviceId: row.deviceId,
    challenge: row.challenge,
    signingPublicKey: row.signingPublicKey,
    recoveryPublicKey: row.recoveryPublicKey,
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt.getTime(),
    ...(row.consumedAt === null
      ? {}
      : { consumedAt: row.consumedAt.getTime() }),
  });
