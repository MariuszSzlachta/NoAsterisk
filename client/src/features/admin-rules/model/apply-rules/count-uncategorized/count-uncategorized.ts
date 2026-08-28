export const countUncategorized = (
  transactions: ReadonlyArray<{ readonly categoryId?: string }>,
): number =>
  transactions.filter((tx) => tx.categoryId === undefined).length;
