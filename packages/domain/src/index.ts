/**
 * Domain package barrel. Uses Node.js subpath imports (#domain/*).
 * Verified: Vite 8.x resolves these transitively via workspace protocol.
 * If a future bundler breaks resolution, replace #domain/* with relative imports here.
 */
export { DomainError } from '#domain/shared/domain-error';
export { generateId } from '#domain/shared/identifier';
export { Transaction, TransactionType } from '#domain/transaction/transaction.entity';
export { Money } from '#domain/transaction/money.vo';
export { isTransactionType } from '#domain/transaction/transaction-type.guard';
export { computeContentHashInput } from '#domain/transaction/content-hash';
export { ImportBatch, ImportBatchStatus } from '#domain/import-batch/import-batch.entity';
export { CategorizationRule } from '#domain/categorization-rule/categorization-rule.entity';
export { MatcherType } from '#domain/categorization-rule/matcher-type.enum';
export { ContainsMatcher, ExactMatcher, MATCHERS } from '#domain/categorization-rule/matchers';
export type { CategorizationMatcher } from '#domain/categorization-rule/matchers';
export { Category } from '#domain/category/category.entity';
export { Account } from '#domain/account/account.entity';
export { Budget } from '#domain/budget/budget.entity';
export type { BudgetPeriod } from '#domain/budget/budget-period.vo';
export {
  validateBudgetPeriod,
  getCurrentRange,
  getDaysRemaining,
  getTotalDays,
  getDaysElapsed,
} from '#domain/budget/budget-period.vo';
