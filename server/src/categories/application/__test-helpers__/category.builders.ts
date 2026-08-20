import { Category } from '@budget/domain';
import { CategoryRepository } from '@categories/application/ports/category.repository';

export const WORKSPACE_A = 'workspace-a';
export const WORKSPACE_B = 'workspace-b';

export const buildMockRepo = (): jest.Mocked<CategoryRepository> => ({
  save: jest.fn(),
  findByWorkspaceId: jest.fn(),
  findById: jest.fn(),
  findByIds: jest.fn(),
  delete: jest.fn(),
});

export const buildCategory = (
  overrides: Partial<{ id: string; workspaceId: string; name: string }> = {},
): Category =>
  new Category(
    overrides.id ?? 'cat-1',
    overrides.workspaceId ?? WORKSPACE_A,
    overrides.name ?? 'Groceries',
    new Date('2025-01-01'),
  );
