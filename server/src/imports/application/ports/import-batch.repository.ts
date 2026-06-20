import { ImportBatch } from '@imports/domain/import-batch.entity';

export const IMPORT_BATCH_REPOSITORY = Symbol('IMPORT_BATCH_REPOSITORY');

export interface ImportBatchRepository {
  save(batch: ImportBatch): Promise<ImportBatch>;
  findById(id: string): Promise<ImportBatch | undefined>;
  findByWorkspaceId(workspaceId: string): Promise<ImportBatch[]>;
  findByBatchHash(
    workspaceId: string,
    batchHash: string,
  ): Promise<ImportBatch | undefined>;
  delete(id: string): Promise<void>;
}
