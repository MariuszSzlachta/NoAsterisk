import { DomainError } from '@budget/domain';
import { assertRecoveryRegistrationSnapshot } from '@vault-protocol/domain/recovery-registration/assert-snapshot';
import { recoveryRegistrationFormat } from '@vault-protocol/domain/recovery-registration/constants';
import type {
  CurrentRecoveryRegistrationAuthority,
  RecoveryRegistrationScope,
  RecoveryRegistrationSnapshot,
} from '@vault-protocol/domain/recovery-registration/types';

/** One-use intent; consuming it cannot change the signed public transcript. */
export class RecoveryAuthorityRegistration {
  readonly snapshot: RecoveryRegistrationSnapshot;

  constructor(snapshot: RecoveryRegistrationSnapshot) {
    assertRecoveryRegistrationSnapshot(snapshot);
    this.snapshot = Object.freeze({ ...snapshot });
  }

  assertScope(scope: RecoveryRegistrationScope): void {
    if (
      this.snapshot.userId !== scope.userId ||
      this.snapshot.workspaceId !== scope.workspaceId ||
      this.snapshot.vaultId !== scope.vaultId ||
      this.snapshot.keyId !== scope.keyId ||
      this.snapshot.deviceId !== scope.deviceId
    )
      throw new DomainError('Recovery authority registration is unavailable');
  }

  assertCanRegister(
    authority: CurrentRecoveryRegistrationAuthority,
    now: number,
  ): void {
    this.assertScope(authority);
    if (
      !Number.isSafeInteger(now) ||
      now < this.snapshot.createdAt ||
      now >= this.snapshot.expiresAt ||
      this.snapshot.consumedAt !== undefined ||
      authority.protocolVersion !== '2' ||
      authority.cryptoSuite !== recoveryRegistrationFormat.cryptoSuite ||
      authority.isDeviceRevoked ||
      (authority.deviceStatus !== 'active' &&
        authority.deviceStatus !== 'high-security') ||
      authority.signingPublicKey !== this.snapshot.signingPublicKey ||
      authority.recoveryPublicKey !== undefined
    )
      throw new DomainError('Recovery authority registration is unavailable');
  }

  consume(
    authority: CurrentRecoveryRegistrationAuthority,
    now: number,
  ): RecoveryAuthorityRegistration {
    this.assertCanRegister(authority, now);
    return new RecoveryAuthorityRegistration({
      ...this.snapshot,
      consumedAt: now,
    });
  }

  assertAuthorizationLive(now: number, authDeadline: number): void {
    if (
      !Number.isSafeInteger(now) ||
      !Number.isSafeInteger(authDeadline) ||
      now > authDeadline
    )
      throw new DomainError('Recovery authority registration is unavailable');
  }

  toSigningBytes(): Uint8Array<ArrayBuffer> {
    return new TextEncoder().encode(
      JSON.stringify([
        recoveryRegistrationFormat.domain,
        recoveryRegistrationFormat.version,
        recoveryRegistrationFormat.cryptoSuite,
        this.snapshot.userId,
        this.snapshot.workspaceId,
        this.snapshot.vaultId,
        this.snapshot.keyId,
        this.snapshot.deviceId,
        this.snapshot.challenge,
        new Date(this.snapshot.expiresAt).toISOString(),
        this.snapshot.signingPublicKey,
        this.snapshot.recoveryPublicKey,
      ]),
    );
  }
}
