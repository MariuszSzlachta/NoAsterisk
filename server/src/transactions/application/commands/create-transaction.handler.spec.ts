import { BadRequestException } from '@nestjs/common';
import { Category } from '@budget/domain';
import { CreateTransactionHandler } from '@transactions/application/commands/create-transaction.handler';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import { CategoryRepository } from '@categories/application/ports/category.repository';
import type { CreateTransactionCommand } from './create-transaction.handler';
import {
  WORKSPACE_A,
  WORKSPACE_B,
  buildMockTransactionRepo,
  buildMockCategoryRepo,
} from '@transactions/application/__test-helpers__/transaction.builders';

describe('CreateTransactionHandler', () => {
  let handler: CreateTransactionHandler;
  let repo: jest.Mocked<TransactionRepository>;
  let categoryRepo: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    repo = buildMockTransactionRepo();
    categoryRepo = buildMockCategoryRepo();
    handler = new CreateTransactionHandler(repo, categoryRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const buildCommand = (
    overrides: Partial<{
      workspaceId: string;
      categoryIds: string[];
    }> = {},
  ): CreateTransactionCommand => ({
    workspaceId: overrides.workspaceId ?? WORKSPACE_A,
    accountId: 'acc-1',
    amount: 100,
    currency: 'PLN',
    type: 'expense',
    categoryIds: overrides.categoryIds ?? [],
    description: 'Test transaction',
    date: new Date('2025-01-15'),
  });

  it('creates transaction without categories', async () => {
    repo.save.mockImplementation(async (tx) => tx);

    const result = await handler.execute(buildCommand());

    expect(result.amount).toBe(100);
    expect(repo.save).toHaveBeenCalled();
  });

  it('creates transaction with valid workspace-owned categories', async () => {
    const ownedCategory = new Category(
      'cat-1',
      WORKSPACE_A,
      'Groceries',
      new Date('2025-01-01'),
    );
    categoryRepo.findByIds.mockResolvedValue([ownedCategory]);
    repo.save.mockImplementation(async (tx) => tx);

    const result = await handler.execute(
      buildCommand({ categoryIds: ['cat-1'] }),
    );

    expect(result).toBeDefined();
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws BadRequestException when category belongs to different workspace', async () => {
    const foreignCategory = new Category(
      'cat-foreign',
      WORKSPACE_B,
      'Foreign',
      new Date('2025-01-01'),
    );
    categoryRepo.findByIds.mockResolvedValue([foreignCategory]);

    await expect(
      handler.execute(buildCommand({ categoryIds: ['cat-foreign'] })),
    ).rejects.toThrow(BadRequestException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when category does not exist', async () => {
    categoryRepo.findByIds.mockResolvedValue([]);

    await expect(
      handler.execute(buildCommand({ categoryIds: ['non-existent'] })),
    ).rejects.toThrow(BadRequestException);

    expect(repo.save).not.toHaveBeenCalled();
  });
});
