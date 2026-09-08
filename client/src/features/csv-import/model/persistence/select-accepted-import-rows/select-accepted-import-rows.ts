import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry';
import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import type { AcceptedImportRow } from '#features/csv-import/model/persistence/types';
import { isImportableRow } from '#features/csv-import/model/persistence/is-importable-row';

/** Selects only rows explicitly accepted after anonymization review. */
export const selectAcceptedImportRows = (
  rows: ReadonlyArray<TransactionRow>,
  entries: ReadonlyArray<AnonymizationEntry>,
): ReadonlyArray<AcceptedImportRow> => {
  const entriesByIndex = new Map(entries.map((entry) => [entry.rowIndex, entry]));

  return rows.flatMap((row, rowIndex) => {
    const entry = entriesByIndex.get(rowIndex);
    if (!isImportableRow(row) || entry?.accepted !== true) {
      return [];
    }
    return [{ row, rowIndex, description: entry.anonymizedTitle }];
  });
};
