import type { UncategorizedTransaction } from '#features/admin-rules/model/uncategorized-transaction';

export const filterUncategorized = (
  transactions: ReadonlyArray<UncategorizedTransaction>,
): ReadonlyArray<UncategorizedTransaction> =>
  transactions.filter((tx) => tx.categoryId === undefined);
