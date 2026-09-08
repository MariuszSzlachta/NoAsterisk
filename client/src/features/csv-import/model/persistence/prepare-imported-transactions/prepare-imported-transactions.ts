import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import type { PreparedImportedTransactions } from '#features/csv-import/model/persistence/types';
import { computeImportContentHash } from '#features/csv-import/model/persistence/compute-import-content-hash';
import { isImportableRow } from '#features/csv-import/model/persistence/is-importable-row';
import { mapImportRowToStoredTransaction } from '#features/csv-import/model/persistence/map-import-row-to-stored-transaction';
import { selectAcceptedImportRows } from '#features/csv-import/model/persistence/select-accepted-import-rows';
import { REVIEW_REQUIRED } from '#features/csv-import/model/persistence/prepare-imported-transactions/constants/review-required';
import { UNIMPORTABLE_ROW } from '#features/csv-import/model/persistence/prepare-imported-transactions/constants/unimportable-row';

/** Creates the complete local write set while retaining reasons for excluded rows. */
export const prepareImportedTransactions = async (
  rows: ReadonlyArray<TransactionRow>,
  entries: ReadonlyArray<AnonymizationEntry>,
  batchId: string,
  importedAt: string,
): Promise<PreparedImportedTransactions> => {
  const acceptedRows = selectAcceptedImportRows(rows, entries);
  const acceptedIndexes = new Set(acceptedRows.map(({ rowIndex }) => rowIndex));
  const entriesByIndex = new Map(entries.map((entry) => [entry.rowIndex, entry]));
  const rejectedRows = rows.flatMap((row, rowIndex) => {
    if (acceptedIndexes.has(rowIndex)) {
      return [];
    }
    const entry = entriesByIndex.get(rowIndex);
    const reason =
      isImportableRow(row) && entry?.accepted !== true
        ? REVIEW_REQUIRED
        : row.statusReason ?? UNIMPORTABLE_ROW;
    return [{ rowIndex, reason }];
  });
  const preparedRows = await Promise.all(
    acceptedRows.map(async (acceptedRow) => ({
      ...acceptedRow,
      contentHash: await computeImportContentHash(
        acceptedRow.row.date,
        acceptedRow.row.amount,
        acceptedRow.description,
      ),
    })),
  );
  const records = preparedRows.map(({ row, description, contentHash }) =>
    mapImportRowToStoredTransaction(row, {
      id: row.id,
      description,
      contentHash,
      batchId,
      importedAt,
    }),
  );

  return { records, rejectedRows };
};
