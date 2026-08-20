import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Category } from '@budget/domain';
import { UpdateTransactionHandler } from '@transactions/application/commands/update-transaction.handler';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import { CategoryRepository } from '@categories/application/ports/category.repository';
import {
  WORKSPACE_A,
  WORKSPACE_B,
  buildMockTransactionRepo,
  buildMockCategoryRepo,
  buildTransaction,
} from '@transactions/application/__test-helpers__/transaction.builders';

describe('UpdateTransactionHandler', () => {
  let handler: UpdateTransactionHandler;
  let repo: jest.Mocked<TransactionRepository>;
  let categoryRepo: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    repo = buildMockTransactionRepo();
    categoryRepo = buildMockCategoryRepo();
    handler = new UpdateTransactionHandler(repo, categoryRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('updates transaction when workspace matches', async () => {
    const existing = buildTransaction({
      id: 'tx-1',
      workspaceId: WORKSPACE_A,
      description: 'Old',
    });
    repo.findById.mockResolvedValue(existing);
    repo.save.mockImplementation(async (tx) => tx);

    const result = await handler.execute({
      id: 'tx-1',
      workspaceId: WORKSPACE_A,
      description: 'Updated',
    });

    expect(result.description).toBe('Updated');
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException when transaction belongs to different workspace', async () => {
    const existing = buildTransaction({
      id: 'tx-1',
      workspaceId: WORKSPACE_A,
    });
    repo.findById.mockResolvedValue(existing);

    await expect(
      handler.execute({
        id: 'tx-1',
        workspaceId: WORKSPACE_B,
        description: 'Hacked',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when transaction does not exist', async () => {
    repo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({
        id: 'non-existent',
        workspaceId: WORKSPACE_A,
        description: 'Anything',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when assigning category from different workspace', async () => {
    const existing = buildTransaction({
      id: 'tx-1',
      workspaceId: WORKSPACE_A,
    });
    repo.findById.mockResolvedValue(existing);

    const foreignCategory = new Category(
      'cat-foreign',
      WORKSPACE_B,
      'Foreign Category',
      new Date('2025-01-01'),
    );
    categoryRepo.findByIds.mockResolvedValue([foreignCategory]);

    await expect(
      handler.execute({
        id: 'tx-1',
        workspaceId: WORKSPACE_A,
        categoryIds: ['cat-foreign'],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repo.save).not.toHaveBeenCalled();
  });
});
