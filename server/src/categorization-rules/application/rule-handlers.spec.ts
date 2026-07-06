import { CreateRuleHandler } from '@categorization-rules/application/commands/create-rule.handler';
import { UpdateRuleHandler } from '@categorization-rules/application/commands/update-rule.handler';
import { DeleteRuleHandler } from '@categorization-rules/application/commands/delete-rule.handler';
import { GetRulesHandler } from '@categorization-rules/application/queries/get-rules.handler';
import { CategorizationRuleRepository } from '@categorization-rules/application/ports/categorization-rule.repository';
import { CategoryRepository } from '@categories/application/ports/category.repository';
import { CategorizationRule, MatcherType, Category } from '@budget/domain';
import { BadRequestException } from '@nestjs/common';

const buildRepo = (): jest.Mocked<CategorizationRuleRepository> => ({
  save: jest.fn().mockImplementation((r) => Promise.resolve(r)),
  findById: jest.fn(),
  findByWorkspaceId: jest.fn(),
  findPaged: jest.fn(),
  delete: jest.fn(),
});

const buildCategoryRepo = (): jest.Mocked<
  Pick<CategoryRepository, 'findById'>
> => ({
  findById: jest.fn(),
});

const buildRule = (
  overrides?: Partial<{
    id: string;
    workspaceId: string;
    keyword: string;
    priority: number;
  }>,
): CategorizationRule =>
  new CategorizationRule(
    overrides?.id ?? 'rule-1',
    overrides?.workspaceId ?? 'ws-1',
    overrides?.keyword ?? 'BIEDRONKA',
    'cat-1',
    MatcherType.Contains,
    overrides?.priority ?? 1,
    new Date('2026-06-01'),
  );

describe('CreateRuleHandler', () => {
  it('creates rule and returns DTO', async () => {
    const repo = buildRepo();
    const categoryRepo = buildCategoryRepo();
    categoryRepo.findById.mockResolvedValue(
      new Category('cat-1', 'ws-1', 'Groceries', new Date()),
    );
    const handler = new CreateRuleHandler(
      repo,
      categoryRepo as unknown as CategoryRepository,
    );

    const result = await handler.execute({
      workspaceId: 'ws-1',
      keyword: 'LIDL',
      categoryId: 'cat-1',
      matcherType: 'Contains',
    });

    expect(result.keyword).toBe('LIDL');
    expect(result.matcherType).toBe('Contains');
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws BadRequestException when category not found', async () => {
    const repo = buildRepo();
    const categoryRepo = buildCategoryRepo();
    categoryRepo.findById.mockResolvedValue(undefined);
    const handler = new CreateRuleHandler(
      repo,
      categoryRepo as unknown as CategoryRepository,
    );

    await expect(
      handler.execute({
        workspaceId: 'ws-1',
        keyword: 'X',
        categoryId: 'cat-nonexistent',
        matcherType: 'Exact',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('UpdateRuleHandler', () => {
  it('updates and returns DTO', async () => {
    const repo = buildRepo();
    const categoryRepo = buildCategoryRepo();
    repo.findById.mockResolvedValue(buildRule());
    const handler = new UpdateRuleHandler(
      repo,
      categoryRepo as unknown as CategoryRepository,
    );

    const result = await handler.execute({
      workspaceId: 'ws-1',
      id: 'rule-1',
      keyword: 'ŻABKA',
    });

    expect(result?.keyword).toBe('ŻABKA');
  });

  it('validates categoryId when provided', async () => {
    const repo = buildRepo();
    const categoryRepo = buildCategoryRepo();
    repo.findById.mockResolvedValue(buildRule());
    categoryRepo.findById.mockResolvedValue(undefined);
    const handler = new UpdateRuleHandler(
      repo,
      categoryRepo as unknown as CategoryRepository,
    );

    await expect(
      handler.execute({
        workspaceId: 'ws-1',
        id: 'rule-1',
        categoryId: 'bad-cat',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns undefined when not found', async () => {
    const repo = buildRepo();
    const categoryRepo = buildCategoryRepo();
    repo.findById.mockResolvedValue(undefined);
    const handler = new UpdateRuleHandler(
      repo,
      categoryRepo as unknown as CategoryRepository,
    );

    const result = await handler.execute({ workspaceId: 'ws-1', id: 'nope' });
    expect(result).toBeUndefined();
  });

  it('returns undefined when workspace mismatch', async () => {
    const repo = buildRepo();
    const categoryRepo = buildCategoryRepo();
    repo.findById.mockResolvedValue(buildRule({ workspaceId: 'ws-other' }));
    const handler = new UpdateRuleHandler(
      repo,
      categoryRepo as unknown as CategoryRepository,
    );

    const result = await handler.execute({ workspaceId: 'ws-1', id: 'rule-1' });
    expect(result).toBeUndefined();
  });
});

describe('DeleteRuleHandler', () => {
  it('deletes and returns true', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(buildRule());
    const handler = new DeleteRuleHandler(repo);

    const result = await handler.execute({ workspaceId: 'ws-1', id: 'rule-1' });

    expect(result).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('rule-1');
  });

  it('returns false when not found', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(undefined);
    const handler = new DeleteRuleHandler(repo);

    expect(await handler.execute({ workspaceId: 'ws-1', id: 'x' })).toBe(false);
  });
});

describe('GetRulesHandler', () => {
  it('returns paginated rules from repo', async () => {
    const repo = buildRepo();
    repo.findPaged.mockResolvedValue({
      data: [
        buildRule({ id: 'r1', priority: 5 }),
        buildRule({ id: 'r2', priority: 1 }),
      ],
      meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
    });
    const handler = new GetRulesHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      page: 1,
      limit: 50,
    });

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(repo.findPaged).toHaveBeenCalledWith('ws-1', { page: 1, limit: 50 });
  });

  it('returns empty result for no rules', async () => {
    const repo = buildRepo();
    repo.findPaged.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
    const handler = new GetRulesHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      page: 1,
      limit: 50,
    });
    expect(result.data).toHaveLength(0);
  });
});
