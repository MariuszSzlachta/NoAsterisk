import {
  createVaultPayload,
  serializeVaultPayload,
} from '#features/user-settings';
import { encryptedPersistence } from '#shared/adapters/persistence';
import {
  BudgetDatabase,
  getAccountDatabaseName,
  VaultV2Database,
} from '#shared/adapters/persistence/dexie';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

export const buildRemoteFixture = async (
  plaintext?: string,
): Promise<{
  readonly context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  };
  readonly vmk: Uint8Array;
  readonly snapshot: {
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
    readonly revision: number;
    readonly previousEnvelopeHash: string;
    readonly envelopeHash: string;
    readonly header: string;
    readonly ciphertext: string;
    readonly signature: string;
    readonly signingPublicKey: string;
    readonly createdAt: string;
  };
  readonly payload: ReturnType<typeof createVaultPayload>;
  readonly database: VaultV2Database;
  readonly dispose: () => Promise<void>;
}> => {
  const context = {
    accountId: `test-${crypto.randomUUID()}`,
    workspaceId: crypto.randomUUID(),
    vaultId: crypto.randomUUID(),
    keyId: crypto.randomUUID(),
    deviceId: crypto.randomUUID(),
  };
  encryptedPersistence.setAccountContext(
    context.accountId,
    context.workspaceId,
  );
  const vmk = vaultProtocol.generateVmk();
  const signing = await deviceSigningKey.generate();
  const keys = await vaultProtocol.deriveKeys(vmk, context);
  const payload = createVaultPayload({
    transactions: [
      {
        id: 'tx-fixture',
        date: '2026-01-01',
        description: 'Synthetic financial transaction',
        amount: -100,
        currency: 'PLN',
        contentHash: 'hash',
        batchId: 'batch',
        importedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    rules: [],
    categories: [],
    budgets: [],
    periodHistory: [],
    importHistory: [],
  });
  const created = await opaqueSyncSnapshot.create({
    plaintext: plaintext ?? serializeVaultPayload(payload),
    context,
    revision: 7,
    previousEnvelopeHash: 'A'.repeat(43) + '=',
    signingKey: signing.privateKey,
    syncKey: keys.sync,
  });
  const snapshot = {
    vaultId: context.vaultId,
    keyId: context.keyId,
    deviceId: context.deviceId,
    revision: 7,
    previousEnvelopeHash: created.envelope.header.previousEnvelopeHash,
    envelopeHash: created.state.envelopeHash,
    header: JSON.stringify(created.envelope.header),
    ciphertext: created.envelope.ciphertext,
    signature: created.envelope.signature,
    signingPublicKey: JSON.stringify(
      await deviceSigningKey.exportPublicJwk(signing.publicKey),
    ),
    createdAt: created.envelope.header.createdAt,
  };
  const database = new VaultV2Database(
    context.accountId,
    context.workspaceId,
    context.vaultId,
  );
  return {
    context,
    vmk,
    snapshot,
    payload,
    database,
    dispose: async (): Promise<void> => {
      encryptedPersistence.lock();
      vmk.fill(0);
      await database.delete();
      await new BudgetDatabase(
        getAccountDatabaseName(context.accountId, context.workspaceId),
      ).delete();
    },
  };
};
