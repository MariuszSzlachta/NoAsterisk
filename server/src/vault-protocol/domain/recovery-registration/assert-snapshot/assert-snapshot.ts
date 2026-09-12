import { DomainError } from '@budget/domain';
import { recoveryRegistrationFormat } from '@vault-protocol/domain/recovery-registration/constants';
import { recoveryChallengePattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-challenge.pattern';
import { recoveryPublicKeyPattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-public-key.pattern';
import type { RecoveryRegistrationSnapshot } from '@vault-protocol/domain/recovery-registration/types';

export const assertRecoveryRegistrationSnapshot = (
  snapshot: RecoveryRegistrationSnapshot,
): void => {
  const identifiers = [
    snapshot.id,
    snapshot.userId,
    snapshot.workspaceId,
    snapshot.vaultId,
    snapshot.keyId,
    snapshot.deviceId,
  ];
  if (
    !identifiers.every(
      (value) =>
        typeof value === 'string' &&
        value.length > 0 &&
        value.length <= recoveryRegistrationFormat.maxIdentifierLength,
    ) ||
    typeof snapshot.challenge !== 'string' ||
    snapshot.challenge.length !== recoveryRegistrationFormat.challengeLength ||
    !recoveryChallengePattern.test(snapshot.challenge) ||
    typeof snapshot.recoveryPublicKey !== 'string' ||
    snapshot.recoveryPublicKey.length !==
      recoveryRegistrationFormat.publicKeyLength ||
    !recoveryPublicKeyPattern.test(snapshot.recoveryPublicKey) ||
    typeof snapshot.signingPublicKey !== 'string' ||
    snapshot.signingPublicKey.length < 2 ||
    snapshot.signingPublicKey.length >
      recoveryRegistrationFormat.maxSigningPublicKeyLength ||
    !Number.isSafeInteger(snapshot.createdAt) ||
    snapshot.createdAt < 0 ||
    !Number.isSafeInteger(snapshot.expiresAt) ||
    snapshot.expiresAt > recoveryRegistrationFormat.maxTimestampMs ||
    snapshot.expiresAt - snapshot.createdAt !==
      recoveryRegistrationFormat.ttlMs ||
    (snapshot.consumedAt !== undefined &&
      (!Number.isSafeInteger(snapshot.consumedAt) ||
        snapshot.consumedAt < snapshot.createdAt ||
        snapshot.consumedAt >= snapshot.expiresAt))
  )
    throw new DomainError('Invalid recovery authority registration');
};
