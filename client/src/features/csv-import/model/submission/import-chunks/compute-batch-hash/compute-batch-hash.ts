import type { TransactionRow } from '#features/csv-import/model/transformation/types';

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
