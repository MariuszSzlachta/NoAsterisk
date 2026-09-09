import {
  decryptRecord,
  encryptRecord,
} from '#shared/adapters/persistence/crypto';
import type { BudgetDatabase } from '#shared/adapters/persistence/dexie/budget-database';
import type {
  EncryptedRepository,
  EncryptedWriteResult,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';
import { persistenceSyncMetadata } from '#shared/adapters/persistence/sync-metadata';

export const createEncryptedDexieRepository = <TRecord extends object>(
  database: BudgetDatabase,
  collection: PersistenceCollection,
  getKey: () => CryptoKey,
  validator: (value: unknown) => value is TRecord,
  getId: (record: TRecord) => string,
  runExclusive: <TResult>(task: () => Promise<TResult>) => Promise<TResult>,
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
    const envelopes = await database.records
      .where('collection')
      .equals(collection)
      .toArray();
    return Promise.all(
      envelopes.map((envelope) =>
        decryptRecord(envelope, collection, key, validator),
      ),
    );
  };

  const put = async (record: TRecord): Promise<void> => {
    const envelope = await encryptRecord(
      collection,
      getId(record),
      record,
      getKey(),
    );
    await database.transaction('rw', database.records, async () => {
      await database.records.put(envelope);
    });
    persistenceSyncMetadata.markDirty();
  };

  const putMany = async (records: ReadonlyArray<TRecord>): Promise<void> => {
    const envelopes = await Promise.all(
      records.map((record) =>
        encryptRecord(collection, getId(record), record, getKey()),
      ),
    );
    await database.transaction('rw', database.records, async () => {
      await database.records.bulkPut(envelopes);
    });
    if (records.length > 0) {
      persistenceSyncMetadata.markDirty();
    }
  };

  /**
   * Serializes read-filter-encrypt-write under the database lock. The first
   * record for a duplicate key wins, and encryption completes before the
   * single Dexie transaction starts so validation/encryption failures write nothing.
   */
  const putManyIfAbsent = async (
    records: ReadonlyArray<TRecord>,
    getDuplicateKey: (record: TRecord) => string,
  ): Promise<EncryptedWriteResult<TRecord>> =>
    runExclusive(async () => {
      const existing = await getAll();
      const seenKeys = new Set(existing.map(getDuplicateKey));
      const uniqueRecords = records.filter((record) => {
        const duplicateKey = getDuplicateKey(record);
        if (seenKeys.has(duplicateKey)) {
          return false;
        }
        seenKeys.add(duplicateKey);
        return true;
      });
      const duplicatesSkipped = records.length - uniqueRecords.length;
      const envelopes = await Promise.all(
        uniqueRecords.map((record) =>
          encryptRecord(collection, getId(record), record, getKey()),
        ),
      );

      await database.transaction('rw', database.records, async () => {
        await database.records.bulkPut(envelopes);
      });

      if (uniqueRecords.length > 0) {
        persistenceSyncMetadata.markDirty();
      }

      return { written: uniqueRecords, duplicatesSkipped };
    });

  const replace = async (records: ReadonlyArray<TRecord>): Promise<void> => {
    const envelopes = await Promise.all(
      records.map((record) =>
        encryptRecord(collection, getId(record), record, getKey()),
      ),
    );
    await database.transaction('rw', database.records, async () => {
      await database.records.where('collection').equals(collection).delete();
      await database.records.bulkPut(envelopes);
    });
    persistenceSyncMetadata.markDirty();
  };

  const deleteRecord = async (id: string): Promise<void> => {
    await database.transaction('rw', database.records, async () => {
      await database.records.delete([collection, id]);
    });
    persistenceSyncMetadata.markDirty();
  };

  const clear = async (): Promise<void> => {
    await database.transaction('rw', database.records, async () => {
      await database.records.where('collection').equals(collection).delete();
    });
    persistenceSyncMetadata.markDirty();
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
