import type {
  VaultV2Database,
  VaultV2RotationJournal,
} from '#shared/adapters/persistence/dexie/vault-v2-database';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

interface RotationContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

interface RotateVaultRecordsInput {
  readonly database: VaultV2Database;
  readonly currentKey: CryptoKey;
  readonly nextKey: CryptoKey;
  readonly nextCheckKey: CryptoKey;
  readonly currentContext: RotationContext;
  readonly nextContext: RotationContext;
  readonly nextLocalShare: CryptoKey | null;
  readonly pendingRotation?: {
    readonly idempotencyKey: string;
    readonly envelopePurpose: 'device-wrap' | 'passkey-wrap';
    readonly envelope: string;
    readonly passkeyEnvelope?: string;
    readonly nextVmk: Uint8Array;
    readonly recoveryBackupConfirmed: true;
  };
  readonly isSessionActive: () => boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const recordContext = (
  context: RotationContext,
  collection: string,
  recordId: string,
) => ({
  accountId: context.accountId,
  workspaceId: context.workspaceId,
  vaultId: context.vaultId,
  keyId: context.keyId,
  collection,
  recordId,
});

const rotate = async (input: RotateVaultRecordsInput): Promise<void> => {
  if (!input.isSessionActive()) throw new Error('Vault session is locked');
  const pendingRotation: VaultV2RotationJournal | undefined =
    input.pendingRotation === undefined
      ? undefined
      : {
          currentKeyId: input.currentContext.keyId,
          nextKeyId: input.nextContext.keyId,
          idempotencyKey: input.pendingRotation.idempotencyKey,
          envelopePurpose: input.pendingRotation.envelopePurpose,
          envelope: input.pendingRotation.envelope,
          recoveryBackupConfirmed:
            input.pendingRotation.recoveryBackupConfirmed,
          ...(input.pendingRotation.passkeyEnvelope === undefined
            ? {}
            : { passkeyEnvelope: input.pendingRotation.passkeyEnvelope }),
          currentVmkEnvelope: await encryptRotationVmk(
            input.pendingRotation.nextVmk,
            input.currentContext,
            input.currentKey,
          ),
          nextVmkEnvelope: await encryptRotationVmk(
            input.pendingRotation.nextVmk,
            input.nextContext,
            input.nextKey,
          ),
        };
  const stored = await input.database.records.toArray();
  const nextRecords = await Promise.all(
    stored.map(async (record) => {
      const plaintext = await vaultProtocol.decryptRecord(
        { header: record.header, ciphertext: record.ciphertext },
        recordContext(input.currentContext, record.collection, record.id),
        input.currentKey,
      );
      const parsed: unknown = JSON.parse(plaintext);
      if (!isRecord(parsed)) throw new Error('Vault record validation failed');
      const encrypted = await vaultProtocol.encryptRecord(
        plaintext,
        recordContext(input.nextContext, record.collection, record.id),
        input.nextKey,
      );
      return {
        id: record.id,
        collection: record.collection,
        header: encrypted.header,
        ciphertext: encrypted.ciphertext,
        updatedAt: Date.now(),
      };
    }),
  );
  if (!input.isSessionActive()) throw new Error('Vault session is locked');
  const sentinel = await vaultProtocol.createSentinel(
    {
      accountId: input.nextContext.accountId,
      workspaceId: input.nextContext.workspaceId,
      vaultId: input.nextContext.vaultId,
      keyId: input.nextContext.keyId,
    },
    input.nextCheckKey,
  );
  if (!input.isSessionActive()) throw new Error('Vault session is locked');

  await input.database.transaction(
    'rw',
    input.database.records,
    input.database.metadata,
    async () => {
      if (!input.isSessionActive()) throw new Error('Vault session is locked');
      const metadata = await input.database.metadata.get('vault');
      if (metadata === undefined) throw new Error('Vault metadata is missing');
      const { localShare: _localShare, ...withoutLocalShare } = metadata;
      await input.database.records.clear();
      await input.database.records.bulkPut(nextRecords);
      await input.database.metadata.put({
        ...withoutLocalShare,
        ...(input.nextLocalShare === null
          ? {}
          : { localShare: input.nextLocalShare }),
        accountId: input.nextContext.accountId,
        workspaceId: input.nextContext.workspaceId,
        vaultId: input.nextContext.vaultId,
        keyId: input.nextContext.keyId,
        deviceId: input.nextContext.deviceId,
        sentinel,
        ...(pendingRotation === undefined ? {} : { pendingRotation }),
      });
    },
  );
};

const encryptRotationVmk = async (
  vmk: Uint8Array,
  context: RotationContext,
  key: CryptoKey,
): Promise<{
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
}> => {
  const envelope = await vaultProtocol.encryptRecord(
    JSON.stringify(Array.from(vmk)),
    recordContext(context, '__vault_rotation__', 'next-vmk'),
    key,
  );
  return { header: envelope.header, ciphertext: envelope.ciphertext };
};

export const rotateVaultRecords = Object.freeze({ rotate });
