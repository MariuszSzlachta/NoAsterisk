import type { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';
import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
import { encodeRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/encode';

export const renewVaultRotationJournal = async (
  database: VaultV2Database,
  previousChallenge: string,
  transcript: RotationTranscriptSnapshot,
  assertCurrent: () => void,
): Promise<void> => {
  const nextBytes = encodeRotationTranscript(transcript);
  assertCurrent();
  await database.transaction('rw', database.metadata, async () => {
    assertCurrent();
    const metadata = await database.metadata.get('vault');
    assertCurrent();
    const pending = metadata?.pendingRotation;
    const previous = pending?.transcript;
    if (
      metadata === undefined ||
      pending === undefined ||
      previous === undefined ||
      pending.idempotencyKey !== previousChallenge ||
      previous.challenge !== previousChallenge ||
      pending.recoveryBackupConfirmed !== true ||
      pending.currentKeyId !== previous.currentKeyId ||
      pending.nextKeyId !== previous.nextKeyId ||
      metadata.keyId !== transcript.nextKeyId ||
      metadata.accountId !== transcript.accountId ||
      metadata.workspaceId !== transcript.workspaceId ||
      metadata.vaultId !== transcript.vaultId ||
      metadata.deviceId !== transcript.deviceId
    )
      throw new Error('Pending rotation renewal conflict');
    const previousBytes = encodeRotationTranscript({
      ...previous,
      challenge: transcript.challenge,
      expiresAt: transcript.expiresAt,
    });
    if (
      previousBytes.length !== nextBytes.length ||
      !previousBytes.every((byte, index) => byte === nextBytes[index])
    )
      throw new Error('Pending rotation renewal conflict');
    await database.metadata.put({
      ...metadata,
      pendingRotation: {
        ...pending,
        idempotencyKey: transcript.challenge,
        transcript,
      },
    });
    assertCurrent();
  });
  assertCurrent();
};
