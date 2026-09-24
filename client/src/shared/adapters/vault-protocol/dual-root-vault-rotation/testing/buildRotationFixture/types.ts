import type { VaultV2RotationJournal } from '#shared/adapters/persistence/dexie';
import type { EncryptedPersistence } from '#shared/adapters/persistence/session/session-types/session-types';
import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
import type { AvailableVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';

export interface RotationFixture {
  readonly material: ReturnType<
    EncryptedPersistence['requireVaultSyncMaterial']
  >;
  readonly nextMaterial: ReturnType<
    EncryptedPersistence['requireVaultSyncMaterial']
  >;
  readonly pending: VaultV2RotationJournal;
  readonly transcript: RotationTranscriptSnapshot;
  readonly bootstrap: AvailableVaultBootstrapMetadata;
  readonly backup: string;
  readonly nextBackup: string;
  readonly localShare: CryptoKey;
}
