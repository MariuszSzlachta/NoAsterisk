import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { ImportBatch, ImportBatchStatus } from '@budget/domain';
import { ImportBatchRepository } from '@imports/application/ports/import-batch.repository';
import {
  PagedResult,
  PageOptions,
} from '@shared/application/types/paged-query.types';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { importBatches } from '@shared/infrastructure/database/schema';

@Injectable()
export class PostgresImportBatchRepository implements ImportBatchRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(batch: ImportBatch): Promise<ImportBatch> {
    await this.db
      .insert(importBatches)
      .values({
        id: batch.id,
        workspaceId: batch.workspaceId,
        batchHash: batch.batchHash,
        sourceFilename: batch.sourceFilename ?? null,
        totalRows: batch.totalRows,
        savedRows: batch.savedRows,
        status: batch.status,
        importedAt: batch.importedAt,
        completedAt: batch.completedAt ?? null,
      })
      .onConflictDoUpdate({
        target: importBatches.id,
        set: {
          savedRows: batch.savedRows,
          status: batch.status,
          completedAt: batch.completedAt ?? null,
        },
      });
    return batch;
  }

  // ARCH-EXCEPTION: global-scope findById — UUID is unguessable,
  // handler verifies workspace ownership post-fetch. Defense-in-depth gap accepted.
  async findById(id: string): Promise<ImportBatch | undefined> {
    const rows = await this.db
      .select()
      .from(importBatches)
      .where(eq(importBatches.id, id));
    return this.toDomain(rows[0]);
  }

  async findByWorkspaceId(workspaceId: string): Promise<ImportBatch[]> {
    const rows = await this.db
      .select()
      .from(importBatches)
      .where(eq(importBatches.workspaceId, workspaceId))
      .orderBy(desc(importBatches.importedAt));
    return rows
      .map((r) => this.toDomain(r))
      .filter((b): b is ImportBatch => b !== undefined);
  }

  async findPaged(
    workspaceId: string,
    page: PageOptions,
  ): Promise<PagedResult<ImportBatch>> {
    const offset = (page.page - 1) * page.limit;
    const whereClause = eq(importBatches.workspaceId, workspaceId);

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(importBatches)
        .where(whereClause)
        .orderBy(desc(importBatches.importedAt))
        .limit(page.limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(importBatches)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data: rows
        .map((r) => this.toDomain(r))
        .filter((b): b is ImportBatch => b !== undefined),
      meta: {
        page: page.page,
        limit: page.limit,
        total,
        totalPages: Math.ceil(total / page.limit),
      },
    };
  }

  async findByBatchHash(
    workspaceId: string,
    batchHash: string,
  ): Promise<ImportBatch | undefined> {
    const rows = await this.db
      .select()
      .from(importBatches)
      .where(
        and(
          eq(importBatches.workspaceId, workspaceId),
          eq(importBatches.batchHash, batchHash),
        ),
      );
    return this.toDomain(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(importBatches).where(eq(importBatches.id, id));
  }

  private toDomain(
    row: typeof importBatches.$inferSelect | undefined,
  ): ImportBatch | undefined {
    if (!row) return undefined;
    return new ImportBatch(
      row.id,
      row.workspaceId,
      row.batchHash,
      row.sourceFilename ?? undefined,
      row.totalRows,
      row.savedRows,
      row.status as ImportBatchStatus,
      row.importedAt,
      row.completedAt ?? undefined,
    );
  }
}
