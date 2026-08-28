import type { TransactionRow } from '#features/csv-import/model/transformation/types';
import type { ImportChunkPayload } from '#features/csv-import/model/submission/import-chunk-payload';
import { computeContentHash } from '#features/csv-import/model/submission/import-chunks/compute-content-hash';
import { computeBatchHash } from '#features/csv-import/model/submission/import-chunks/compute-batch-hash';
import { mapRowToPayload } from '#features/csv-import/model/submission/import-chunks/map-row-to-payload';
import { MAX_ROWS_PER_CHUNK } from '#features/csv-import/model/submission/import-chunks/max-rows-per-chunk';
import { isImportableRow } from '#features/csv-import/model/submission/import-chunks/is-importable-row';
import { sliceIntoChunks } from '#features/csv-import/model/submission/import-chunks/slice-into-chunks';

export const createImportChunks = async (
  rows: ReadonlyArray<TransactionRow>,
  options: {
    readonly batchId: string;
    readonly sourceFilename?: string;
    readonly profileId?: string;
  },
): Promise<ReadonlyArray<ImportChunkPayload>> => {
  const importableRows = rows.filter(isImportableRow);

  if (importableRows.length === 0) {
    return [];
  }

  const [contentHashes, batchHash] = await Promise.all([
    Promise.all(importableRows.map((row) => computeContentHash(row))),
    computeBatchHash(importableRows),
  ]);

  return sliceIntoChunks(importableRows, MAX_ROWS_PER_CHUNK).map(
    (chunkRows, chunkIndex) => ({
      batchId: options.batchId,
      batchHash,
      sourceFilename: options.sourceFilename,
      profileId: options.profileId,
      rows: chunkRows.map((row, rowIndex) =>
        mapRowToPayload(
          row,
          contentHashes[chunkIndex * MAX_ROWS_PER_CHUNK + rowIndex],
        ),
      ),
    }),
  );
};
