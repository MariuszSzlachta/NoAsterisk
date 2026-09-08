import {
  decryptRecord,
  encryptRecord,
} from '#shared/adapters/persistence/crypto';
import type { BudgetDatabase } from '#shared/adapters/persistence/dexie/budget-database';
import type {
  EncryptedCollectionWriteIfAbsent,
  EncryptedRelatedWrite,
  EncryptedWriteResult,
} from '#shared/adapters/persistence/ports';

export const putManyIfAbsentWithRelated = async <
  TRecord extends object,
  TRelated extends object,
>(
  database: BudgetDatabase,
  getKey: () => CryptoKey,
  primaryWrite: EncryptedCollectionWriteIfAbsent<TRecord>,
  createRelatedWrite: (
    result: EncryptedWriteResult<TRecord>,
  ) => EncryptedRelatedWrite<TRelated>,
  runExclusive: <TResult>(task: () => Promise<TResult>) => Promise<TResult>,
): Promise<EncryptedWriteResult<TRecord>> =>
  runExclusive(async () => {
    const existingEnvelopes = await database.records
      .where('collection')
      .equals(primaryWrite.collection)
      .toArray();
    const existingRecords = await Promise.all(
      existingEnvelopes.map((envelope) =>
        decryptRecord(
          envelope,
          primaryWrite.collection,
          getKey(),
          primaryWrite.validator,
        ),
      ),
    );
    const seenKeys = new Set(existingRecords.map(primaryWrite.getDuplicateKey));
    const uniqueRecords = primaryWrite.records.filter((record) => {
      const duplicateKey = primaryWrite.getDuplicateKey(record);
      if (seenKeys.has(duplicateKey)) {
        return false;
      }
      seenKeys.add(duplicateKey);
      return true;
    });
    const result: EncryptedWriteResult<TRecord> = {
      written: uniqueRecords,
      duplicatesSkipped: primaryWrite.records.length - uniqueRecords.length,
    };
    const relatedWrite = createRelatedWrite(result);
    const [primaryEnvelopes, relatedEnvelopes] = await Promise.all([
      Promise.all(
        uniqueRecords.map((record) =>
          encryptRecord(
            primaryWrite.collection,
            primaryWrite.getId(record),
            record,
            getKey(),
          ),
        ),
      ),
      Promise.all(
        relatedWrite.records.map((record) =>
          encryptRecord(
            relatedWrite.collection,
            relatedWrite.getId(record),
            record,
            getKey(),
          ),
        ),
      ),
    ]);

    await database.transaction('rw', database.records, async () => {
      await database.records.bulkPut([
        ...primaryEnvelopes,
        ...relatedEnvelopes,
      ]);
    });

    return result;
  });
