import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { isImportHistoryRecord } from '#features/csv-import/model/history/is-import-history-record';
import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { StoredTransaction } from '#features/transactions/model/types';
import { BudgetDatabase } from '#shared/adapters/persistence/dexie';
import { putManyIfAbsentWithRelated } from '#shared/adapters/persistence/dexie/put-many-if-absent-with-related/put-many-if-absent-with-related';
import {
  IMPORT_HISTORY_COLLECTION,
  TRANSACTIONS_COLLECTION,
} from '#shared/adapters/persistence/ports';
import { createEncryptedPersistence } from '#shared/adapters/persistence/session';

const createTransaction = (id: string): StoredTransaction => ({
  id,
  date: '2026-09-01',
  description: id,
  amount: -10,
  currency: 'PLN',
  contentHash: id.padEnd(64, '0'),
  batchId: 'batch-1',
  importedAt: '2026-09-08T10:00:00.000Z',
});

const createHistoryRecord = (acceptedCount: number): ImportHistoryRecord => ({
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount,
  duplicateCount: 0,
  rejectedCount: 0,
});

describe('putManyIfAbsentWithRelated', () => {
  const databases: BudgetDatabase[] = [];

  afterEach(async () => {
    await Promise.all(databases.map((database) => database.delete()));
    databases.splice(0);
  });

  it('commits primary and related records in one transaction', async () => {
    const database = new BudgetDatabase(
      `budgetflow-related-write-test-${crypto.randomUUID()}`,
    );
    databases.push(database);
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const transaction = createTransaction('transaction-1');

    const result = await putManyIfAbsentWithRelated(
      database,
      persistence.requireKey,
      {
        collection: TRANSACTIONS_COLLECTION,
        records: [transaction],
        validator: isStoredTransaction,
        getId: (record) => record.id,
        getDuplicateKey: (record) => record.contentHash,
      },
      (writeResult) => ({
        collection: IMPORT_HISTORY_COLLECTION,
        records: [createHistoryRecord(writeResult.written.length)],
        getId: (record) => record.batchId,
      }),
      async (task) => task(),
    );

    expect(result).toEqual({ written: [transaction], duplicatesSkipped: 0 });
    expect(
      await persistence
        .repository(
          TRANSACTIONS_COLLECTION,
          isStoredTransaction,
          (record) => record.id,
        )
        .getAll(),
    ).toEqual([transaction]);
    expect(
      await persistence
        .repository(
          IMPORT_HISTORY_COLLECTION,
          isImportHistoryRecord,
          (record) => record.batchId,
        )
        .getAll(),
    ).toEqual([createHistoryRecord(1)]);
  });

  it('writes neither collection when related encryption fails', async () => {
    const database = new BudgetDatabase(
      `budgetflow-related-write-failure-test-${crypto.randomUUID()}`,
    );
    databases.push(database);
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const cyclicRecord: { self?: object } = {};
    cyclicRecord.self = cyclicRecord;

    await expect(
      putManyIfAbsentWithRelated(
        database,
        persistence.requireKey,
        {
          collection: TRANSACTIONS_COLLECTION,
          records: [createTransaction('transaction-1')],
          validator: isStoredTransaction,
          getId: (record) => record.id,
          getDuplicateKey: (record) => record.contentHash,
        },
        () => ({
          collection: IMPORT_HISTORY_COLLECTION,
          records: [cyclicRecord],
          getId: () => 'invalid-history',
        }),
        async (task) => task(),
      ),
    ).rejects.toThrow();

    expect(
      await persistence
        .repository(
          TRANSACTIONS_COLLECTION,
          isStoredTransaction,
          (record) => record.id,
        )
        .getAll(),
    ).toEqual([]);
  });
});
