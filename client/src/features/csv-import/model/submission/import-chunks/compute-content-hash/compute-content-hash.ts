import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';

export const computeContentHash = async (
  row: TransactionRow,
): Promise<string> => {
  const input = `${row.date}|${row.amount}|${row.title.toLowerCase().trim()}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};
