import { NotFoundException } from '@nestjs/common';
import { UpdateCategoryHandler } from '@categories/application/commands/update-category.handler';
import { CategoryRepository } from '@categories/application/ports/category.repository';
import {
  WORKSPACE_A,
  WORKSPACE_B,
  buildMockRepo,
  buildCategory,
} from '@categories/application/__test-helpers__/category.builders';

describe('UpdateCategoryHandler', () => {
  let handler: UpdateCategoryHandler;
  let repo: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    repo = buildMockRepo();
    handler = new UpdateCategoryHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('updates category when workspace matches', async () => {
    const existing = buildCategory({ id: 'cat-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(existing);
    repo.save.mockImplementation(async (cat) => cat);

    const result = await handler.execute({
      id: 'cat-1',
      workspaceId: WORKSPACE_A,
      name: 'Renamed',
    });

    expect(result.name).toBe('Renamed');
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException when category belongs to different workspace', async () => {
    const existing = buildCategory({ id: 'cat-1', workspaceId: WORKSPACE_A });
    repo.findById.mockResolvedValue(existing);

    await expect(
      handler.execute({
        id: 'cat-1',
        workspaceId: WORKSPACE_B,
        name: 'Renamed',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when category does not exist', async () => {
    repo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute({
        id: 'non-existent',
        workspaceId: WORKSPACE_A,
        name: 'Renamed',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
