import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Workspace } from '@workspaces/domain/workspace.entity';
import { WorkspaceRepository } from '@workspaces/domain/ports/workspace.repository';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { workspaces } from '@shared/infrastructure/database/schema';

@Injectable()
export class PostgresWorkspaceRepository implements WorkspaceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(workspace: Workspace): Promise<Workspace> {
    await this.db
      .insert(workspaces)
      .values({
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt,
      })
      .onConflictDoUpdate({
        target: workspaces.id,
        set: { name: workspace.name },
      });
    return workspace;
  }

  async findById(id: string): Promise<Workspace | undefined> {
    const rows = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));
    const row = rows[0];
    if (!row) return undefined;
    return new Workspace(row.id, row.name, row.createdAt);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(workspaces).where(eq(workspaces.id, id));
  }
}
