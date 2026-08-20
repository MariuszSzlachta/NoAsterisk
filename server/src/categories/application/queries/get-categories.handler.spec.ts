import { GetCategoriesHandler } from '@categories/application/queries/get-categories.handler';
import { CategoryRepository } from '@categories/application/ports/category.repository';
import {
  WORKSPACE_A,
  buildMockRepo,
  buildCategory,
} from '@categories/application/__test-helpers__/category.builders';

describe('GetCategoriesHandler', () => {
  let handler: GetCategoriesHandler;
  let repo: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    repo = buildMockRepo();
    handler = new GetCategoriesHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns only categories for the given workspace', async () => {
    const catA = buildCategory({ id: 'cat-1', workspaceId: WORKSPACE_A });
    repo.findByWorkspaceId.mockResolvedValue([catA]);

    const result = await handler.execute(WORKSPACE_A);

    expect(repo.findByWorkspaceId).toHaveBeenCalledWith(WORKSPACE_A);
    expect(result).toHaveLength(1);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'cat-1' })]),
    );
  });

  it('returns empty array when workspace has no categories', async () => {
    repo.findByWorkspaceId.mockResolvedValue([]);

    const result = await handler.execute(WORKSPACE_A);

    expect(result).toHaveLength(0);
  });
});
