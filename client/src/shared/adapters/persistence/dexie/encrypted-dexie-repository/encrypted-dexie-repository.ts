import { decryptRecord, encryptRecord } from '#shared/adapters/persistence/crypto';
import type { BudgetDatabase } from '#shared/adapters/persistence/dexie/budget-database';
import type {
  EncryptedRepository,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';

export const createEncryptedDexieRepository = <TRecord extends object>(
  database: BudgetDatabase,
  collection: PersistenceCollection,
  getKey: () => CryptoKey,
  validator: (value: unknown) => value is TRecord,
  getId: (record: TRecord) => string,
): EncryptedRepository<TRecord> => {
  const get = async (id: string): Promise<TRecord | undefined> => {
    const key = getKey();
    const envelope = await database.records.get([collection, id]);
    if (envelope === undefined) {
      return undefined;
    }
    return decryptRecord(envelope, collection, key, validator);
  };

  const getAll = async (): Promise<ReadonlyArray<TRecord>> => {
    const key = getKey();
    const envelopes = await database.records.where('collection').equals(collection).toArray();
    return Promise.all(
      envelopes.map((envelope) => decryptRecord(envelope, collection, key, validator)),
    );
  };

  const put = async (record: TRecord): Promise<void> => {
    const envelope = await encryptRecord(collection, getId(record), record, getKey());
    await database.transaction('rw', database.records, async () => {
      await database.records.put(envelope);
    });
  };

  const putMany = async (records: ReadonlyArray<TRecord>): Promise<void> => {
    const envelopes = await Promise.all(
      records.map((record) => encryptRecord(collection, getId(record), record, getKey())),
    );
    await database.transaction('rw', database.records, async () => {
      await database.records.bulkPut(envelopes);
    });
  };

  const replace = async (records: ReadonlyArray<TRecord>): Promise<void> => {
    const envelopes = await Promise.all(
      records.map((record) => encryptRecord(collection, getId(record), record, getKey())),
    );
    await database.transaction('rw', database.records, async () => {
      await database.records.where('collection').equals(collection).delete();
      await database.records.bulkPut(envelopes);
    });
  };

  const deleteRecord = async (id: string): Promise<void> => {
    await database.transaction('rw', database.records, async () => {
      await database.records.delete([collection, id]);
    });
  };

  const clear = async (): Promise<void> => {
    await database.transaction('rw', database.records, async () => {
      await database.records.where('collection').equals(collection).delete();
    });
  };

  return { get, getAll, put, putMany, replace, delete: deleteRecord, clear };
};
