import { encryptedPersistence } from '#shared/adapters/persistence';
import type { VaultV2RotationJournal } from '#shared/adapters/persistence/dexie';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import type { EncryptedPersistence } from '#shared/adapters/persistence/session/session-types/session-types';
import type { DualRootRotationResult } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/types';
import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/decode';
import { signRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/sign';
import {
  finalizeDualRootRotation,
  prepareDualRootRotation,
} from '#shared/api/vault-protocol/dual-root-rotation';
import type { VaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';

interface ResumeInput {
  readonly material: ReturnType<
    EncryptedPersistence['requireVaultSyncMaterial']
  >;
  readonly generation: number;
  readonly bootstrap: VaultBootstrapMetadata;
  readonly pending: VaultV2RotationJournal;
  readonly recoveryBackup: string;
}

export const resumeDualRootRotation = async ({
  material,
  generation,
  bootstrap,
  pending,
  recoveryBackup,
}: ResumeInput): Promise<DualRootRotationResult> => {
  const original = pending.transcript;
  if (
    original === undefined ||
    pending.recoveryBackupConfirmed !== true ||
    original.challenge !== pending.idempotencyKey ||
    original.accountId !== material.context.accountId ||
    original.workspaceId !== material.context.workspaceId ||
    original.vaultId !== material.context.vaultId ||
    original.deviceId !== material.context.deviceId ||
    original.nextKeyId !== material.context.keyId ||
    original.nextKeyId !== pending.nextKeyId ||
    original.currentKeyId !== pending.currentKeyId ||
    bootstrap.status !== 'available' ||
    bootstrap.vaultId !== original.vaultId ||
    bootstrap.deviceId !== original.deviceId ||
    (bootstrap.keyId !== original.currentKeyId &&
      bootstrap.keyId !== original.nextKeyId) ||
    bootstrap.recoveryPublicKey !==
      (bootstrap.keyId === original.nextKeyId
        ? original.nextRecoveryPublicKey
        : original.currentRecoveryPublicKey)
  )
    throw new Error('Pending dual-root rotation context mismatch');
  const current = await decodeRecoveryBackup(recoveryBackup);
  try {
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    let transcript = original;
    if (
      bootstrap.keyId === original.currentKeyId &&
      Date.parse(original.expiresAt) <= Date.now()
    ) {
      // Renew only the server nonce; the confirmed roots and ciphertext stay fixed.
      transcript = await prepareDualRootRotation({ ...original });
      assertVaultSessionCurrent(
        encryptedPersistence,
        generation,
        material.context,
      );
      if (
        transcript.currentRecoveryPublicKey !==
        original.currentRecoveryPublicKey
      )
        throw new Error('Pending rotation authority changed');
      await encryptedPersistence.renewPendingVaultRotation(
        original.challenge,
        transcript,
      );
      assertVaultSessionCurrent(
        encryptedPersistence,
        generation,
        material.context,
      );
    }
    const proof = await signRotationTranscript(
      transcript,
      material.signingKey,
      current.recoverySeed,
    );
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    await finalizeDualRootRotation({ transcript, ...proof });
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    await encryptedPersistence.clearPendingVaultRotation(transcript.challenge);
    return { status: 'resumed', keyId: transcript.nextKeyId };
  } finally {
    current.vmk.fill(0);
    current.recoverySeed.fill(0);
  }
};
