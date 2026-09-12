import { DomainError } from '@budget/domain';
import { recoveryChallengePattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-challenge.pattern';
import { recoveryPublicKeyPattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-public-key.pattern';
import { enrollmentTranscriptFormat } from '@vault-protocol/domain/value-objects/enrollment-transcript/constants';
import type { EnrollmentTranscriptSnapshot } from '@vault-protocol/domain/value-objects/enrollment-transcript/types';

export const assertEnrollmentTranscriptSnapshot = (
  snapshot: EnrollmentTranscriptSnapshot,
): void => {
  const identifiers = [
    snapshot.accountId,
    snapshot.workspaceId,
    snapshot.vaultId,
    snapshot.keyId,
    snapshot.deviceId,
    ...(snapshot.purpose === 'trusted' ? [snapshot.oldDeviceId] : []),
  ];
  const publicKeys = [
    snapshot.signingPublicKey,
    ...(snapshot.purpose === 'trusted' ? [snapshot.newEphemeralPublicKey] : []),
  ];
  const envelopes = [
    snapshot.deviceEnvelope,
    ...(snapshot.passkeyEnvelope === undefined
      ? []
      : [snapshot.passkeyEnvelope]),
  ];
  const authorityBinding =
    snapshot.purpose === 'trusted'
      ? snapshot.delegationDigest
      : snapshot.recoveryPublicKey;
  if (
    !['initial', 'trusted', 'recovery'].includes(snapshot.purpose) ||
    !identifiers.every(
      (value) =>
        typeof value === 'string' &&
        value.length > 0 &&
        value.length <= enrollmentTranscriptFormat.maxIdentifierLength,
    ) ||
    !publicKeys.every(
      (value) =>
        typeof value === 'string' &&
        value.length >= 2 &&
        value.length <= enrollmentTranscriptFormat.maxPublicKeyLength,
    ) ||
    !envelopes.every(
      (value) =>
        typeof value === 'string' &&
        value.length >= 2 &&
        value.length <= enrollmentTranscriptFormat.maxEnvelopeLength,
    ) ||
    typeof snapshot.challenge !== 'string' ||
    snapshot.challenge.length !== enrollmentTranscriptFormat.challengeLength ||
    !recoveryChallengePattern.test(snapshot.challenge) ||
    typeof authorityBinding !== 'string' ||
    authorityBinding.length !== enrollmentTranscriptFormat.digestLength ||
    !recoveryPublicKeyPattern.test(authorityBinding) ||
    !Number.isSafeInteger(snapshot.createdAt) ||
    snapshot.createdAt < 0 ||
    !Number.isSafeInteger(snapshot.expiresAt) ||
    snapshot.expiresAt > enrollmentTranscriptFormat.maxTimestampMs ||
    snapshot.expiresAt - snapshot.createdAt !==
      enrollmentTranscriptFormat.ttlMs ||
    (snapshot.purpose === 'trusted' &&
      snapshot.oldDeviceId === snapshot.deviceId)
  )
    throw new DomainError('Invalid enrollment authorization transcript');
};
