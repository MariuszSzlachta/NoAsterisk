import { Injectable } from '@nestjs/common';
import { ImportBatch } from '@imports/domain/import-batch.entity';
import { ImportBatchRepository } from '@imports/application/ports/import-batch.repository';

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
