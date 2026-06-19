import { Category } from '@categories/domain/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepository {
  save(category: Category): Promise<Category>;
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | undefined>;
  findByIds(ids: string[]): Promise<Category[]>;
  delete(id: string): Promise<void>;
}
