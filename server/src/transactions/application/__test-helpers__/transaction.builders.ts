import { Transaction, TransactionType, Money } from '@budget/domain';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import { CategoryRepository } from '@categories/application/ports/category.repository';

export const WORKSPACE_A = 'workspace-a';
export const WORKSPACE_B = 'workspace-b';

export const buildMockTransactionRepo =
  (): jest.Mocked<TransactionRepository> => ({
    save: jest.fn(),
    saveMany: jest.fn(),
    findById: jest.fn(),
    findUncategorized: jest.fn(),
    findPaged: jest.fn(),
    existsByCategoryId: jest.fn(),
    delete: jest.fn(),
  });

export const buildMockCategoryRepo = (): jest.Mocked<CategoryRepository> => ({
  save: jest.fn(),
  findByWorkspaceId: jest.fn(),
  findById: jest.fn(),
  findByIds: jest.fn(),
  delete: jest.fn(),
});

export const buildTransaction = (
  overrides: Partial<{
    id: string;
    workspaceId: string;
    accountId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    description: string;
  }> = {},
): Transaction =>
  new Transaction(
    overrides.id ?? 'tx-1',
    overrides.workspaceId ?? WORKSPACE_A,
    overrides.accountId ?? 'acc-1',
    Money.of(overrides.amount ?? 100, overrides.currency ?? 'PLN'),
    overrides.type ?? TransactionType.Expense,
    [],
    overrides.description ?? 'Test transaction',
    new Date('2025-01-15'),
    new Date('2025-01-15'),
  );
