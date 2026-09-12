import { DomainError } from '@budget/domain';
import { recoveryPublicKeyPattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-public-key.pattern';
import { EnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import type { EnrollmentTranscriptScope } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import { encodeEnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript/encode-transcript';
import { enrollmentTranscriptFormat } from '@vault-protocol/domain/value-objects/enrollment-transcript/constants';
import { signedEnrollmentFormat } from '@vault-protocol/domain/entities/signed-enrollment/constants';
import type {
  SignedEnrollmentAuthority,
  SignedEnrollmentFinalization,
  SignedEnrollmentSnapshot,
  SignedEnrollmentDeviceBinding,
} from '@vault-protocol/domain/entities/signed-enrollment/types';

export class SignedEnrollment {
  readonly snapshot: SignedEnrollmentSnapshot;
  private readonly serverShare: Uint8Array<ArrayBuffer> | undefined;

  constructor(snapshot: SignedEnrollmentSnapshot, serverShare?: Uint8Array) {
    const intent = new EnrollmentTranscript(snapshot.intent).snapshot;
    if (
      (snapshot.state.kind !== 'pending' &&
        (snapshot.state.digest.length !==
          enrollmentTranscriptFormat.digestLength ||
          !recoveryPublicKeyPattern.test(snapshot.state.digest))) ||
      !['pending', 'finalized', 'active'].includes(snapshot.state.kind) ||
      (serverShare !== undefined &&
        serverShare.length !== signedEnrollmentFormat.shareBytes)
    )
      throw new DomainError('Invalid signed enrollment');
    this.snapshot = Object.freeze({
      intent,
      state: Object.freeze({ ...snapshot.state }),
    });
    this.serverShare = serverShare?.slice();
  }

  copyPreparedShare(): Uint8Array {
    if (
      this.serverShare === undefined ||
      this.serverShare.byteLength !== signedEnrollmentFormat.shareBytes ||
      this.snapshot.state.kind !== 'pending'
    )
      throw new DomainError('Enrollment share unavailable');
    return this.serverShare.slice();
  }

  /** The prepared share is a disposable resource, not part of the immutable snapshot. */
  disposePreparedShare(): void {
    if (this.serverShare === undefined || this.serverShare.byteLength === 0)
      return;
    this.serverShare.fill(0);
    // Detach the owned buffer so a later projection cannot return a zeroed share as valid.
    structuredClone(this.serverShare.buffer, {
      transfer: [this.serverShare.buffer],
    });
  }

  assertScope(scope: EnrollmentTranscriptScope): void {
    new EnrollmentTranscript(this.snapshot.intent).assertScope(scope);
  }

  assertRecordedLifecycle(
    consumedAt: number | undefined,
    confirmedAt: number | undefined,
  ): void {
    if (consumedAt === undefined) {
      if (this.snapshot.state.kind !== 'pending' || confirmedAt !== undefined)
        throw new DomainError('Invalid signed enrollment lifecycle');
      return;
    }
    if (
      this.snapshot.state.kind === 'pending' ||
      (this.snapshot.state.kind === 'active') !== (confirmedAt !== undefined)
    )
      throw new DomainError('Invalid signed enrollment lifecycle');
    const transcript = new EnrollmentTranscript(this.snapshot.intent);
    transcript.assertLive(consumedAt);
    if (confirmedAt !== undefined) {
      transcript.assertLive(confirmedAt);
      if (confirmedAt < consumedAt)
        throw new DomainError('Invalid signed enrollment lifecycle');
    }
  }

  assertPendingDeviceReplacement(
    binding: SignedEnrollmentDeviceBinding,
    hasLiveConfirmation: boolean,
  ): void {
    this.assertScope(binding);
    if (
      this.snapshot.state.kind !== 'pending' ||
      this.snapshot.intent.purpose === 'initial' ||
      binding.status !== 'pending' ||
      binding.isRevoked ||
      hasLiveConfirmation
    )
      throw new DomainError('Enrollment unavailable');
  }

  assertLive(now: number, authDeadline: number): void {
    new EnrollmentTranscript(this.snapshot.intent).assertLive(now);
    if (!Number.isSafeInteger(authDeadline) || now > authDeadline)
      throw new DomainError('Enrollment authorization unavailable');
  }

  assertAuthority(authority: SignedEnrollmentAuthority): void {
    const intent = this.snapshot.intent;
    if (intent.purpose === 'initial') {
      if (authority.kind !== 'empty')
        throw new DomainError('Enrollment unavailable');
      return;
    }
    if (
      authority.kind !== 'existing' ||
      authority.vaultId !== intent.vaultId ||
      authority.keyId !== intent.keyId ||
      authority.protocolVersion !==
        enrollmentTranscriptFormat.version.toString() ||
      authority.cryptoSuite !== enrollmentTranscriptFormat.suite
    )
      throw new DomainError('Enrollment unavailable');
    if (intent.purpose !== 'trusted') {
      if (
        authority.recoveryPublicKey === undefined ||
        authority.recoveryPublicKey !== intent.recoveryPublicKey
      )
        throw new DomainError('Enrollment unavailable');
      return;
    }
    if (
      authority.approver === undefined ||
      authority.approver.deviceId !== intent.oldDeviceId ||
      authority.approver.deviceId === intent.deviceId ||
      authority.approver.isRevoked ||
      !['active', 'high-security'].includes(authority.approver.status)
    )
      throw new DomainError('Enrollment unavailable');
  }

  finalizeTranscript(
    request: SignedEnrollmentFinalization,
  ): EnrollmentTranscript {
    this.assertScope(request);
    if (
      this.snapshot.state.kind !== 'pending' ||
      request.challenge !== this.snapshot.intent.challenge ||
      request.purpose !== this.snapshot.intent.purpose
    )
      throw new DomainError('Enrollment unavailable');
    const intent = this.snapshot.intent;
    if (intent.purpose === 'trusted' && request.purpose === 'trusted')
      return new EnrollmentTranscript({
        ...intent,
        deviceEnvelope: request.deviceEnvelope,
        ...(request.passkeyEnvelope === undefined
          ? {}
          : { passkeyEnvelope: request.passkeyEnvelope }),
        delegationDigest: request.delegationDigest,
      });
    if (intent.purpose === 'trusted' || request.purpose === 'trusted')
      throw new DomainError('Enrollment unavailable');
    return new EnrollmentTranscript({
      ...intent,
      deviceEnvelope: request.deviceEnvelope,
      ...(request.passkeyEnvelope === undefined
        ? {}
        : { passkeyEnvelope: request.passkeyEnvelope }),
    });
  }

  consume(digest: string): SignedEnrollment {
    if (this.snapshot.state.kind !== 'pending')
      throw new DomainError('Enrollment unavailable');
    return new SignedEnrollment({
      ...this.snapshot,
      state: { kind: 'finalized', digest },
    });
  }

  confirmationBytes(digest: string): Uint8Array<ArrayBuffer> {
    if (
      this.snapshot.state.kind !== 'finalized' ||
      this.snapshot.state.digest !== digest
    )
      throw new DomainError('Enrollment confirmation unavailable');
    const intent = this.snapshot.intent;
    return encodeEnrollmentTranscript([
      signedEnrollmentFormat.confirmationDomain,
      enrollmentTranscriptFormat.version,
      enrollmentTranscriptFormat.suite,
      intent.accountId,
      intent.workspaceId,
      intent.vaultId,
      intent.keyId,
      intent.deviceId,
      intent.challenge,
      new Date(intent.expiresAt).toISOString(),
      digest,
    ]);
  }

  activate(digest: string): SignedEnrollment {
    this.confirmationBytes(digest);
    return new SignedEnrollment({
      ...this.snapshot,
      state: { kind: 'active', digest },
    });
  }
}
