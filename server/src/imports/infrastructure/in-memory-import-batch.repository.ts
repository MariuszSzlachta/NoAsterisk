import { Injectable } from '@nestjs/common';
import { ImportBatch } from '@imports/domain/import-batch.entity';
import { ImportBatchRepository } from '@imports/application/ports/import-batch.repository';
import {
  PagedResult,
  PageOptions,
} from '@shared/application/types/paged-query.types';

@Injectable()
export class InMemoryImportBatchRepository implements ImportBatchRepository {
  private readonly store = new Map<string, ImportBatch>();

  async save(batch: ImportBatch): Promise<ImportBatch> {
    this.store.set(batch.id, batch);
    return batch;
  }

  async findById(id: string): Promise<ImportBatch | undefined> {
    return this.store.get(id);
  }

  async findByWorkspaceId(workspaceId: string): Promise<ImportBatch[]> {
    return [...this.store.values()].filter(
      (b) => b.workspaceId === workspaceId,
    );
  }

  async findPaged(
    workspaceId: string,
    page: PageOptions,
  ): Promise<PagedResult<ImportBatch>> {
    const all = [...this.store.values()]
      .filter((b) => b.workspaceId === workspaceId)
      .sort((a, b) => b.importedAt.getTime() - a.importedAt.getTime());

    const total = all.length;
    const offset = (page.page - 1) * page.limit;
    const data = all.slice(offset, offset + page.limit);

    return {
      data,
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
    return [...this.store.values()].find(
      (b) => b.workspaceId === workspaceId && b.batchHash === batchHash,
    );
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
