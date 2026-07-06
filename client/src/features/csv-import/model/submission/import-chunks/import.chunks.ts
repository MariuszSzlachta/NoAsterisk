import type { ImportChunkPayload, ImportRowPayload, TransactionType } from '../types';
import type { TransactionRow } from '../../transformation/types';

const MAX_ROWS_PER_CHUNK = 200;

/**
 * Compute SHA-256 content hash for a transaction row.
 * Hash input: date|amount|title (lowercase, trimmed).
 * This must match backend expectations for dedup.
 */
export const computeContentHash = async (row: TransactionRow): Promise<string> => {
  const input = `${row.date}|${row.amount}|${row.title.toLowerCase().trim()}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Compute SHA-256 batch hash for all rows combined.
 * Used by backend to detect duplicate batch submissions.
 */
export const computeBatchHash = async (
  rows: ReadonlyArray<TransactionRow>,
): Promise<string> => {
  const combined = rows
    .map((r) => `${r.date}|${r.amount}|${r.title.toLowerCase().trim()}`)
    .join('\n');
  const encoded = new TextEncoder().encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Map a TransactionRow to the API payload format.
 */
const mapRowToPayload = (row: TransactionRow, contentHash: string): ImportRowPayload => ({
  amount: Math.abs(row.amount),
  currency: row.currency,
  type: (row.amount >= 0 ? 'income' : 'expense') as TransactionType,
  description: row.title,
  date: row.date,
  categoryIds: [],
  contentHash,
});

/**
 * Split transaction rows into chunks of max 200 rows each,
 * ready for sequential POST /imports calls.
 *
 * Filters out error and duplicate rows before chunking.
 * Computes contentHash per row and batchHash for the whole submission.
 */
export const createImportChunks = async (
  rows: ReadonlyArray<TransactionRow>,
  options: {
    readonly batchId: string;
    readonly sourceFilename?: string;
    readonly profileId?: string;
  },
): Promise<ReadonlyArray<ImportChunkPayload>> => {
  // Filter to importable rows only (ok + warning, skip errors + duplicates)
  const importableRows = rows.filter(
    (r) => r.status === 'ok' || r.status === 'warning',
  );

  if (importableRows.length === 0) {
    return [];
  }

  // Compute hashes
  const contentHashes = await Promise.all(
    importableRows.map((row) => computeContentHash(row)),
  );
  const batchHash = await computeBatchHash(importableRows);

  // Split into chunks of MAX_ROWS_PER_CHUNK
  const chunks: ImportChunkPayload[] = [];
  for (let i = 0; i < importableRows.length; i += MAX_ROWS_PER_CHUNK) {
    const chunkRows = importableRows.slice(i, i + MAX_ROWS_PER_CHUNK);
    const chunkHashes = contentHashes.slice(i, i + MAX_ROWS_PER_CHUNK);

    const payloadRows = chunkRows.map((row, idx) =>
      mapRowToPayload(row, chunkHashes[idx]),
    );

    chunks.push({
      batchId: options.batchId,
      batchHash,
      sourceFilename: options.sourceFilename,
      profileId: options.profileId,
      rows: payloadRows,
    });
  }

  return chunks;
};
