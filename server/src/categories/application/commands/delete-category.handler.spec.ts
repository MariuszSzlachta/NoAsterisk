import { NotFoundException, ConflictException } from '@nestjs/common';
import { DeleteCategoryHandler } from '@categories/application/commands/delete-category.handler';
import { CategoryRepository } from '@categories/application/ports/category.repository';
import { CategoryUsagePort } from '@categories/application/ports/category-usage.port';
import {
  WORKSPACE_A,
  WORKSPACE_B,
  buildMockRepo,
  buildCategory,
} from '@categories/application/__test-helpers__/category.builders';

describe('DeleteCategoryHandler', () => {
  let handler: DeleteCategoryHandler;
  let repo: jest.Mocked<CategoryRepository>;
  let usageChecker: jest.Mocked<CategoryUsagePort>;

  beforeEach(() => {
    repo = buildMockRepo();
    usageChecker = {
      isCategoryInUse: jest.fn(),
    };
    handler = new DeleteCategoryHandler(repo, usageChecker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deletes category when workspace matches and not in use', async () => {
    const existing = buildCategory({ id: 'cat-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(existing);
    usageChecker.isCategoryInUse.mockResolvedValue(false);

    await handler.execute({ id: 'cat-1', workspaceId: WORKSPACE_A });

    expect(repo.delete).toHaveBeenCalledWith('cat-1');
  });

  it('throws NotFoundException when category belongs to different workspace', async () => {
    const existing = buildCategory({ id: 'cat-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(existing);

    await expect(
      handler.execute({ id: 'cat-1', workspaceId: WORKSPACE_B }),
    ).rejects.toThrow(NotFoundException);

    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when category does not exist', async () => {
    repo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({ id: 'non-existent', workspaceId: WORKSPACE_A }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when category is in use', async () => {
    const existing = buildCategory({ id: 'cat-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(existing);
    usageChecker.isCategoryInUse.mockResolvedValue(true);

    await expect(
      handler.execute({ id: 'cat-1', workspaceId: WORKSPACE_A }),
    ).rejects.toThrow(ConflictException);

    expect(repo.delete).not.toHaveBeenCalled();
  });
});
