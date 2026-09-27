import {
  captureVaultRestoreScope,
  createVaultRestorePlan,
  parseVaultPayload,
  restoreVaultPayload,
} from '#features/user-settings';
import { VAULT_NETWORK_TIMEOUT_MS } from '#features/user-settings/api/constants/vault-network-timeout';
import { vaultOperationQueue } from '#model/vault/lib/vault-operation-queue';
import { persistenceSyncMetadata } from '#shared/adapters/persistence';
import { VaultV2Database } from '#shared/adapters/persistence/dexie';
import { assertSnapshotBinding } from '#shared/adapters/vault-protocol/assert-snapshot-binding';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { syncSnapshotApi } from '#shared/api/vault-protocol/sync-snapshot-api';

export const prepareEnrollmentRestore = async (
  context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  },
  vmk: Uint8Array,
  assertCurrent: () => void,
): Promise<(() => Promise<void>) | undefined> => {
  assertCurrent();
  const metadata = persistenceSyncMetadata.get();
  const keys = await vaultProtocol.deriveKeys(vmk, context);
  assertCurrent();
  const database = new VaultV2Database(
    context.accountId,
    context.workspaceId,
    context.vaultId,
  );
  try {
    const local = await database.metadata.get('vault');
    assertCurrent();
    if (local !== undefined) {
      if (
        local.accountId !== context.accountId ||
        local.workspaceId !== context.workspaceId ||
        local.vaultId !== context.vaultId ||
        local.keyId !== context.keyId
      )
        throw new Error('Local recovery metadata scope mismatch');
      await vaultProtocol.verifySentinel(local.sentinel, context, keys.check);
      assertCurrent();
      if (
        local.requiresRemoteRestore === false ||
        (local.requiresRemoteRestore === undefined &&
          (await database.records.count()) > 0)
      ) {
        assertCurrent();
        return undefined;
      }
    }
  } finally {
    database.close();
  }
  const remote = await syncSnapshotApi.get(
    context.vaultId,
    AbortSignal.timeout(VAULT_NETWORK_TIMEOUT_MS),
  );
  assertCurrent();
  if (remote.status !== 'available' || remote.snapshot === undefined)
    throw new Error('Remote vault snapshot unavailable');
  const snapshot = remote.snapshot;
  const envelope = {
    header: JSON.parse(snapshot.header),
    ciphertext: snapshot.ciphertext,
    signature: snapshot.signature,
  };
  await assertSnapshotBinding(envelope, snapshot);
  assertCurrent();
  const sender = await deviceSigningKey.importPublicJwk(
    JSON.parse(snapshot.signingPublicKey),
  );
  assertCurrent();
  const plaintext = await opaqueSyncSnapshot.openEnvelope(
    envelope,
    context,
    keys.sync,
    sender,
    {
      revision: metadata.observedRevision ?? 0,
      envelopeHash: metadata.highWaterEnvelopeHash,
    },
  );
  assertCurrent();
  const payload = parseVaultPayload(plaintext);
  if (createVaultRestorePlan(payload) === undefined)
    throw new Error('Remote financial payload failed validation');
  return async (): Promise<void> => {
    await vaultOperationQueue(async () => {
      assertCurrent();
      const currentMetadata = persistenceSyncMetadata.get();
      if (
        currentMetadata.observedRevision !== metadata.observedRevision ||
        currentMetadata.highWaterEnvelopeHash !==
          metadata.highWaterEnvelopeHash ||
        currentMetadata.mutationVersion !== metadata.mutationVersion
      )
        throw new Error('Vault changed while preparing enrollment restore');
      const scope = captureVaultRestoreScope();
      await restoreVaultPayload(
        payload,
        {
          generation: scope.generation,
          mutationVersion: scope.mutationVersion,
          assertCurrent: (): void => {
            assertCurrent();
            scope.assertCurrent();
          },
        },
        {
          revision: snapshot.revision,
          createdAt: snapshot.createdAt,
          envelopeHash: snapshot.envelopeHash,
        },
      );
      assertCurrent();
    });
  };
};
