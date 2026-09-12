import type { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';
import type {
  EncryptedRepository,
  EncryptedWriteResult,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

interface VaultContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

interface VaultRecordEnvelope {
  readonly id: string;
  readonly collection: string;
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
  readonly updatedAt: number;
}

const createEnvelope = async <TRecord extends object>(
  collection: PersistenceCollection,
  record: TRecord,
  getId: (value: TRecord) => string,
  key: CryptoKey,
  context: VaultContext,
) => {
  const id = getId(record);
  const encrypted = await vaultProtocol.encryptRecord(
    JSON.stringify(record),
    {
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      keyId: context.keyId,
      collection,
      recordId: id,
    },
    key,
  );
  return {
    id,
    collection,
    header: encrypted.header,
    ciphertext: encrypted.ciphertext,
    updatedAt: Date.now(),
  };
};

export const createVaultV2Repository = <TRecord extends object>(
  database: VaultV2Database,
  collection: PersistenceCollection,
  getKey: () => CryptoKey,
  validator: (value: unknown) => value is TRecord,
  getId: (record: TRecord) => string,
  context: VaultContext,
  runExclusive: <TResult>(task: () => Promise<TResult>) => Promise<TResult>,
  isSessionActive: () => boolean,
  onMutation: () => void = () => undefined,
): EncryptedRepository<TRecord> => {
  const assertSessionActive = (): void => {
    if (!isSessionActive()) throw new Error('Encrypted persistence session is locked');
  };
  const decrypt = async (
    envelope: VaultRecordEnvelope | undefined,
  ): Promise<TRecord> => {
    if (envelope === undefined)
      return Promise.reject(new Error('Record not found'));
    const plaintext = await vaultProtocol.decryptRecord(
      { header: envelope.header, ciphertext: envelope.ciphertext },
      { ...context, collection, recordId: envelope.id },
      getKey(),
    );
    const parsed: unknown = JSON.parse(plaintext);
    if (!validator(parsed)) throw new Error('Vault record validation failed');
    return parsed;
  };
  const get = async (id: string): Promise<TRecord | undefined> => {
    const envelope = await database.records.get([collection, id]);
    if (envelope === undefined) return undefined;
    return decrypt(envelope);
  };
  const getAll = async (): Promise<ReadonlyArray<TRecord>> =>
    Promise.all(
      (
        await database.records.where('collection').equals(collection).toArray()
      ).map(decrypt),
    );
  const put = async (record: TRecord): Promise<void> => {
    await runExclusive(() => writeMany([record]));
  };
  const writeMany = async (records: ReadonlyArray<TRecord>): Promise<void> => {
    assertSessionActive();
    const envelopes = await Promise.all(
      records.map((record) =>
        createEnvelope(collection, record, getId, getKey(), context),
      ),
    );
    assertSessionActive();
    await database.transaction('rw', database.records, async () => {
      assertSessionActive();
      await database.records.bulkPut(envelopes);
    });
    if (records.length > 0) onMutation();
  };
  const putMany = async (records: ReadonlyArray<TRecord>): Promise<void> => {
    await runExclusive(() => writeMany(records));
  };
  const putManyIfAbsent = async (
    records: ReadonlyArray<TRecord>,
    getDuplicateKey: (record: TRecord) => string,
  ): Promise<EncryptedWriteResult<TRecord>> => {
    return runExclusive(async () => {
      const existing = await getAll();
      const seen = new Set(existing.map(getDuplicateKey));
      const written = records.filter((record) => {
        const duplicateKey = getDuplicateKey(record);
        if (seen.has(duplicateKey)) return false;
        seen.add(duplicateKey);
        return true;
      });
      await writeMany(written);
      return { written, duplicatesSkipped: records.length - written.length };
    });
  };
  const replace = async (records: ReadonlyArray<TRecord>): Promise<void> => {
    await runExclusive(async () => {
      assertSessionActive();
      const envelopes = await Promise.all(
        records.map((record) =>
          createEnvelope(collection, record, getId, getKey(), context),
        ),
      );
      assertSessionActive();
      await database.transaction('rw', database.records, async () => {
        assertSessionActive();
        await database.records.where('collection').equals(collection).delete();
        await database.records.bulkPut(envelopes);
      });
      onMutation();
    });
  };
  const deleteRecord = async (id: string): Promise<void> => {
    await runExclusive(async () => {
      assertSessionActive();
      await database.records.delete([collection, id]);
      onMutation();
    });
  };
  const clear = async (): Promise<void> => {
    await runExclusive(async () => {
      assertSessionActive();
      await database.records.where('collection').equals(collection).delete();
      onMutation();
    });
  };
  return {
    get,
    getAll,
    put,
    putMany,
    putManyIfAbsent,
    replace,
    delete: deleteRecord,
    clear,
  };
};
