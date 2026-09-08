import { autoCategorize, type RuleRecord } from '#features/admin-rules';
import type { StoredTransaction } from '#features/transactions/model/types';

/** Applies rules only to records without an imported category. */
export const categorizeImportedTransactions = (
  records: ReadonlyArray<StoredTransaction>,
  rules: ReadonlyArray<RuleRecord>,
): ReadonlyArray<StoredTransaction> => {
  const results = autoCategorize(
    rules,
    records.map(({ id, description, categoryId }) => ({
      id,
      description,
      categoryId,
    })),
  );
  const categoriesById = new Map(
    results.map(({ transactionId, categoryId }) => [transactionId, categoryId]),
  );

  return records.map((record) => {
    if (record.categoryId !== undefined) {
      return record;
    }
    const categoryId = categoriesById.get(record.id);
    return categoryId === undefined ? record : { ...record, categoryId };
  });
};
