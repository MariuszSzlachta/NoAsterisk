import { decryptRecord } from '#shared/adapters/persistence/crypto';
import type { BudgetDatabase } from '#shared/adapters/persistence/dexie/budget-database';
import type { EncryptedRecordDeletion } from '#shared/adapters/persistence/ports';

export const deleteMatchingRecords = async (
  database: BudgetDatabase,
  getKey: () => CryptoKey,
  deletions: ReadonlyArray<EncryptedRecordDeletion>,
  runExclusive: <TResult>(task: () => Promise<TResult>) => Promise<TResult>,
): Promise<void> =>
  runExclusive(async () => {
    const keysToDelete = await Promise.all(
      deletions.map(async (deletion) => {
        const envelopes = await database.records
          .where('collection')
          .equals(deletion.collection)
          .toArray();
        const records = await Promise.all(
          envelopes.map(async (envelope) => ({
            envelope,
            record: await decryptRecord(
              envelope,
              deletion.collection,
              getKey(),
              deletion.validator,
            ),
          })),
        );

        return records
          .filter(({ record }) => deletion.shouldDelete(record))
          .map(({ envelope }): [string, string] => [
            deletion.collection,
            envelope.id,
          ]);
      }),
    );

    await database.transaction('rw', database.records, async () => {
      await keysToDelete.reduce(async (previous, keys) => {
        await previous;
        await database.records.bulkDelete(keys);
      }, Promise.resolve());
    });
  });
