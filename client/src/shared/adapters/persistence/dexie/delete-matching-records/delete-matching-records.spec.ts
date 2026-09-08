import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { isImportHistoryRecord } from '#features/csv-import/model/history/is-import-history-record';
import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { StoredTransaction } from '#features/transactions/model/types';
import { BudgetDatabase } from '#shared/adapters/persistence/dexie';
import { deleteMatchingRecords } from '#shared/adapters/persistence/dexie/delete-matching-records/delete-matching-records';
import {
  IMPORT_HISTORY_COLLECTION,
  TRANSACTIONS_COLLECTION,
} from '#shared/adapters/persistence/ports';
import { createEncryptedPersistence } from '#shared/adapters/persistence/session';

const createTransaction = (id: string, batchId: string): StoredTransaction => ({
  id,
  date: '2026-09-01',
  description: id,
  amount: -10,
  currency: 'PLN',
  contentHash: id.padEnd(64, '0'),
  batchId,
  importedAt: '2026-09-08T10:00:00.000Z',
});

const createHistoryRecord = (
  batchId: string,
  fileName: string,
): ImportHistoryRecord => ({
  batchId,
  fileName,
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount: 1,
  duplicateCount: 0,
  rejectedCount: 0,
});

describe('deleteMatchingRecords', () => {
  const databases: BudgetDatabase[] = [];

  afterEach(async () => {
    await Promise.all(databases.map((database) => database.delete()));
    databases.splice(0);
  });

  it('deletes only the selected import history record and linked transactions atomically', async () => {
    const database = new BudgetDatabase(
      `budgetflow-delete-test-${crypto.randomUUID()}`,
    );
    databases.push(database);
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const transactionRepository = persistence.repository(
      TRANSACTIONS_COLLECTION,
      isStoredTransaction,
      (record) => record.id,
    );
    const historyRepository = persistence.repository(
      IMPORT_HISTORY_COLLECTION,
      isImportHistoryRecord,
      (record) => record.batchId,
    );
    const selectedBatch = 'batch-selected';

    await transactionRepository.putMany([
      createTransaction('selected-transaction', selectedBatch),
      createTransaction('other-transaction', 'batch-other'),
      createTransaction('manual-transaction', 'manual'),
    ]);
    await historyRepository.putMany([
      createHistoryRecord(selectedBatch, 'statement.csv'),
      createHistoryRecord('batch-other', 'statement.csv'),
    ]);

    await deleteMatchingRecords(
      database,
      persistence.requireKey,
      [
        {
          collection: TRANSACTIONS_COLLECTION,
          validator: isStoredTransaction,
          shouldDelete: (record) =>
            isStoredTransaction(record) && record.batchId === selectedBatch,
        },
        {
          collection: IMPORT_HISTORY_COLLECTION,
          validator: isImportHistoryRecord,
          shouldDelete: (record) =>
            isImportHistoryRecord(record) && record.batchId === selectedBatch,
        },
      ],
      async (task) => task(),
    );

    expect(
      (await transactionRepository.getAll()).map((record) => record.id).sort(),
    ).toEqual(['manual-transaction', 'other-transaction']);
    expect(await historyRepository.getAll()).toEqual([
      createHistoryRecord('batch-other', 'statement.csv'),
    ]);
  });
});
