import { DomainError } from '@budget/domain';
import { assertEnrollmentTranscriptSnapshot } from '@vault-protocol/domain/value-objects/enrollment-transcript/assert-snapshot';
import { enrollmentTranscriptFormat } from '@vault-protocol/domain/value-objects/enrollment-transcript/constants';
import { encodeEnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript/encode-transcript';
import type {
  EnrollmentTranscriptScope,
  EnrollmentTranscriptSnapshot,
} from '@vault-protocol/domain/value-objects/enrollment-transcript/types';

/** Authorization bytes only; constructing this value does not verify a signature. */
export class EnrollmentTranscript {
  readonly snapshot: EnrollmentTranscriptSnapshot;

  constructor(snapshot: EnrollmentTranscriptSnapshot) {
    assertEnrollmentTranscriptSnapshot(snapshot);
    this.snapshot = Object.freeze({ ...snapshot });
    this.toFinalizeSigningBytes();
  }

  assertScope(scope: EnrollmentTranscriptScope): void {
    if (
      scope.accountId !== this.snapshot.accountId ||
      scope.workspaceId !== this.snapshot.workspaceId ||
      scope.vaultId !== this.snapshot.vaultId ||
      scope.keyId !== this.snapshot.keyId ||
      scope.deviceId !== this.snapshot.deviceId
    )
      throw new DomainError('Enrollment authorization context mismatch');
  }

  assertLive(now: number): void {
    if (
      !Number.isSafeInteger(now) ||
      now < this.snapshot.createdAt ||
      now >= this.snapshot.expiresAt
    )
      throw new DomainError('Enrollment authorization expired');
  }

  toDelegationSigningBytes(): Uint8Array<ArrayBuffer> {
    if (this.snapshot.purpose !== 'trusted')
      throw new DomainError('Enrollment does not accept device delegation');
    return encodeEnrollmentTranscript([
      enrollmentTranscriptFormat.delegationDomain,
      enrollmentTranscriptFormat.version,
      enrollmentTranscriptFormat.suite,
      this.snapshot.accountId,
      this.snapshot.workspaceId,
      this.snapshot.vaultId,
      this.snapshot.keyId,
      this.snapshot.deviceId,
      this.snapshot.challenge,
      new Date(this.snapshot.expiresAt).toISOString(),
      this.snapshot.oldDeviceId,
      this.snapshot.signingPublicKey,
      this.snapshot.newEphemeralPublicKey,
    ]);
  }

  toFinalizeSigningBytes(): Uint8Array<ArrayBuffer> {
    return encodeEnrollmentTranscript([
      enrollmentTranscriptFormat.finalizeDomain,
      enrollmentTranscriptFormat.version,
      enrollmentTranscriptFormat.suite,
      this.snapshot.purpose,
      this.snapshot.accountId,
      this.snapshot.workspaceId,
      this.snapshot.vaultId,
      this.snapshot.keyId,
      this.snapshot.deviceId,
      this.snapshot.challenge,
      new Date(this.snapshot.expiresAt).toISOString(),
      this.snapshot.signingPublicKey,
      this.snapshot.purpose === 'trusted' ? this.snapshot.oldDeviceId : null,
      this.snapshot.purpose === 'trusted'
        ? this.snapshot.newEphemeralPublicKey
        : null,
      this.snapshot.purpose === 'trusted'
        ? this.snapshot.delegationDigest
        : this.snapshot.recoveryPublicKey,
      this.snapshot.deviceEnvelope,
      this.snapshot.passkeyEnvelope ?? null,
    ]);
  }
}
