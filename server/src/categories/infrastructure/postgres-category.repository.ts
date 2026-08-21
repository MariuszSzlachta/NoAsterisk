import { Injectable, Inject } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { Category } from '@budget/domain';
import { CategoryRepository } from '@categories/application/ports/category.repository';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { categories } from '@shared/infrastructure/database/schema';

@Injectable()
export class PostgresCategoryRepository implements CategoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(category: Category): Promise<Category> {
    await this.db
      .insert(categories)
      .values({
        id: category.id,
        workspaceId: category.workspaceId,
        name: category.name,
        color: category.color ?? null,
        icon: category.icon ?? null,
        createdAt: category.createdAt,
      })
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: category.name,
          color: category.color ?? null,
          icon: category.icon ?? null,
        },
      });
    return category;
  }

  async findByWorkspaceId(workspaceId: string): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.workspaceId, workspaceId));
    return rows
      .map((r) => this.toDomain(r))
      .filter((c): c is Category => c !== undefined);
  }

  // ARCH-EXCEPTION: global-scope findById — UUID is unguessable,
  // handler verifies workspace ownership post-fetch. Defense-in-depth gap accepted.
  async findById(id: string): Promise<Category | undefined> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return this.toDomain(rows[0]);
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(categories)
      .where(inArray(categories.id, ids));
    return rows
      .map((r) => this.toDomain(r))
      .filter((c): c is Category => c !== undefined);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }

  private toDomain(
    row: typeof categories.$inferSelect | undefined,
  ): Category | undefined {
    if (!row) return undefined;
    return new Category(
      row.id,
      row.workspaceId,
      row.name,
      row.createdAt,
      row.color ?? undefined,
      row.icon ?? undefined,
    );
  }
}
