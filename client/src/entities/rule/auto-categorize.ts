import type {
  AutoCategorizeResult,
  RuleRecord,
  UncategorizedTransaction,
} from './types';

const MIN_PRIORITY = 1;

const isValidRule = (rule: RuleRecord): boolean =>
  rule.keyword.trim().length > 0 && rule.priority >= MIN_PRIORITY;

const matchesRule = (description: string, rule: RuleRecord): boolean => {
  if (!isValidRule(rule)) {
    return false;
  }

  const normalizedDescription = description.toLowerCase();
  const normalizedKeyword = rule.keyword.toLowerCase();
  return rule.matcherType === 'Exact'
    ? normalizedDescription === normalizedKeyword
    : normalizedDescription.includes(normalizedKeyword);
};

export const autoCategorize = (
  rules: ReadonlyArray<RuleRecord>,
  transactions: ReadonlyArray<UncategorizedTransaction>,
): ReadonlyArray<AutoCategorizeResult> => {
  const sortedRules = rules
    .filter(isValidRule)
    .toSorted((left, right) => right.priority - left.priority);

  return transactions.reduce<AutoCategorizeResult[]>((results, transaction) => {
    if (transaction.categoryId !== undefined) {
      return results;
    }

    const rule = sortedRules.find((candidate) =>
      matchesRule(transaction.description, candidate),
    );
    if (rule !== undefined) {
      results.push({
        transactionId: transaction.id,
        categoryId: rule.categoryId,
      });
    }
    return results;
  }, []);
};
