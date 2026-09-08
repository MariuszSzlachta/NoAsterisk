import type { CategoryInfo } from '#entities/category';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import type { StandardBudgetRecord } from '#features/budgets/model/types/standard-budget-record';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import type { StoredTransaction } from '#features/transactions/model/types';
import type { ImportProfileRecord } from '#shared/adapters/persistence/ports';

const createTransaction = (overrides: Partial<StoredTransaction> = {}): StoredTransaction => ({
  id: 'tx-1',
  date: '2026-09-07',
  description: 'Secret merchant',
  amount: -42.5,
  currency: 'PLN',
  contentHash: 'hash-1',
  batchId: 'manual',
  importedAt: '2026-09-07T10:00:00.000Z',
  ...overrides,
});

const createRule = (overrides: Partial<RuleRecord> = {}): RuleRecord => ({
  id: 'rule-1',
  keyword: 'LIDL',
  matcherType: 'Contains',
  categoryId: 'cat-1',
  priority: 1,
  createdAt: '2026-09-07T10:00:00.000Z',
  ...overrides,
});

const createCategory = (overrides: Partial<CategoryInfo> = {}): CategoryInfo => ({
  id: 'cat-1',
  label: 'Food',
  color: '#fff',
  ...overrides,
});

const createBudget = (overrides: Partial<StandardBudgetRecord> = {}): StandardBudgetRecord => ({
  id: 'budget-1',
  workspaceId: 'workspace-1',
  name: 'Food',
  color: '#fff',
  limitAmount: 1000,
  limitCurrency: 'PLN',
  categoryIds: ['cat-1'],
  createdAt: '2026-09-07T10:00:00.000Z',
  isArchived: false,
  budgetType: 'standard',
  period: { type: 'monthly' },
  ...overrides,
});

const createHistory = (overrides: Partial<PeriodHistoryRecord> = {}): PeriodHistoryRecord => ({
  id: 'history-1',
  budgetId: 'budget-1',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  limitAmount: 1000,
  spentAmount: 400,
  remainingAmount: 600,
  closedAt: '2026-09-30T10:00:00.000Z',
  rollover: null,
  ...overrides,
});

const createImportProfile = (overrides: Partial<ImportProfileRecord> = {}): ImportProfileRecord => ({
  id: 'profile-1',
  name: 'Bank CSV',
  columnMapping: { date: 'Date' },
  createdAt: '2026-09-07T10:00:00.000Z',
  ...overrides,
});

export const persistenceTestData = {
  createBudget,
  createCategory,
  createHistory,
  createImportProfile,
  createRule,
  createTransaction,
};
