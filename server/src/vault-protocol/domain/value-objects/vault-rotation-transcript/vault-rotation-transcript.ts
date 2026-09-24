import { assertVaultRotationTranscriptSnapshot } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/assert-snapshot';
import { vaultRotationTranscriptFormat } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/constants';
import { encodeVaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/encode-transcript';
import type { VaultRotationTranscriptSnapshot } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/types';

export class VaultRotationTranscript {
  readonly snapshot: VaultRotationTranscriptSnapshot;

  constructor(snapshot: VaultRotationTranscriptSnapshot) {
    assertVaultRotationTranscriptSnapshot(snapshot);
    this.snapshot = Object.freeze({ ...snapshot });
  }

  toSigningBytes(): Uint8Array<ArrayBuffer> {
    const snapshot = this.snapshot;
    return encodeVaultRotationTranscript([
      vaultRotationTranscriptFormat.domain,
      vaultRotationTranscriptFormat.version,
      vaultRotationTranscriptFormat.cryptoSuite,
      snapshot.accountId,
      snapshot.workspaceId,
      snapshot.vaultId,
      snapshot.deviceId,
      snapshot.currentKeyId,
      snapshot.nextKeyId,
      snapshot.challenge,
      new Date(snapshot.expiresAt).toISOString(),
      snapshot.currentRecoveryPublicKey,
      snapshot.nextRecoveryPublicKey,
      snapshot.signingPublicKey,
      snapshot.envelopePurpose,
      snapshot.envelope,
      snapshot.passkeyEnvelope ?? null,
    ]);
  }
}
