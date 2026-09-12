import type { RemoteVaultSnapshot } from '#features/user-settings/api/synchronize-vault/types';
import type { encryptedPersistence } from '#shared/adapters/persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import type { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';

export const mapCreatedSnapshot = async (
  material: ReturnType<typeof encryptedPersistence.requireVaultSyncMaterial>,
  created: Awaited<ReturnType<typeof opaqueSyncSnapshot.create>>,
): Promise<RemoteVaultSnapshot> => ({
  vaultId: material.context.vaultId,
  keyId: material.context.keyId,
  deviceId: material.context.deviceId,
  revision: created.envelope.header.revision,
  previousEnvelopeHash: created.envelope.header.previousEnvelopeHash,
  envelopeHash: created.state.envelopeHash,
  header: JSON.stringify(created.envelope.header),
  ciphertext: created.envelope.ciphertext,
  signature: created.envelope.signature,
  signingPublicKey: JSON.stringify(
    await deviceSigningKey.exportPublicJwk(material.verifyKey),
  ),
  createdAt: created.envelope.header.createdAt,
});
