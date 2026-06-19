import { Injectable } from '@nestjs/common';
import { Category } from '@categories/domain/category.entity';
import { CategoryRepository } from '@categories/application/ports/category.repository';

@Injectable()
export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly store = new Map<string, Category>();

  async save(category: Category): Promise<Category> {
    this.store.set(category.id, category);
    return category;
  }

  async findAll(): Promise<Category[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Category | undefined> {
    return this.store.get(id);
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    return ids
      .map((id) => this.store.get(id))
      .filter((c): c is Category => c !== undefined);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
