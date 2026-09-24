import { DomainError } from '@budget/domain';
import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import type { vaultRotationChallenges } from '@shared/infrastructure/database/schema';

export const mapRotationChallengeToTranscript = (
  row: typeof vaultRotationChallenges.$inferSelect,
): VaultRotationTranscript => {
  if (
    row.envelopePurpose !== 'device-wrap' &&
    row.envelopePurpose !== 'passkey-wrap'
  )
    throw new DomainError('Dual-root vault rotation is unavailable');
  return new VaultRotationTranscript({
    accountId: row.userId,
    workspaceId: row.workspaceId,
    vaultId: row.vaultId,
    deviceId: row.deviceId,
    currentKeyId: row.currentKeyId,
    nextKeyId: row.nextKeyId,
    challenge: row.challenge,
    expiresAt: row.expiresAt.getTime(),
    currentRecoveryPublicKey: row.currentRecoveryPublicKey,
    nextRecoveryPublicKey: row.nextRecoveryPublicKey,
    signingPublicKey: row.signingPublicKey,
    envelopePurpose: row.envelopePurpose,
    envelope: row.envelope,
    ...(row.passkeyEnvelope === null
      ? {}
      : { passkeyEnvelope: row.passkeyEnvelope }),
  });
};
