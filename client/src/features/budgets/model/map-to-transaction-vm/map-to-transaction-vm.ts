import type { BudgetTransactionInput } from '#features/budgets/model/types/budget-transaction-input';
import type { BudgetTransactionVM } from '#features/budgets/model/types/budget-transaction-vm';

export const mapToTransactionVM = (tx: BudgetTransactionInput): BudgetTransactionVM => ({
  id: tx.id,
  description: tx.description,
  amount: tx.amount,
  currency: tx.currency,
  date: tx.date,
});
