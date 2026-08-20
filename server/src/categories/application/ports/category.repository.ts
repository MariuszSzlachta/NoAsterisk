import { Category } from '@budget/domain';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepository {
  save(category: Category): Promise<Category>;
  findByWorkspaceId(workspaceId: string): Promise<Category[]>;
  findById(id: string): Promise<Category | undefined>;
  findByIds(ids: string[]): Promise<Category[]>;
  delete(id: string): Promise<void>;
}
