import { parseISO } from 'date-fns';

import type { BudgetTransactionInput } from '#features/budgets/model/types/budget-transaction-input';

export const filterTransactionsForBudget = (
  transactions: readonly BudgetTransactionInput[],
  budgetId: string,
  from: Date,
  to: Date,
): readonly BudgetTransactionInput[] =>
  transactions.filter((tx) => {
    if (tx.budgetId !== budgetId) {
      return false;
    }
    const txDate = parseISO(tx.date);
    return txDate >= from && txDate <= to;
  });
