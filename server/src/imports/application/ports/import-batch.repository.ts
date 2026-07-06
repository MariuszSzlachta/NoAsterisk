import { ImportBatch } from '@budget/domain';
import {
  PagedResult,
  PageOptions,
} from '@shared/application/types/paged-query.types';

export const IMPORT_BATCH_REPOSITORY = Symbol('IMPORT_BATCH_REPOSITORY');

export interface ImportBatchRepository {
  save(batch: ImportBatch): Promise<ImportBatch>;
  findById(id: string): Promise<ImportBatch | undefined>;
  findByWorkspaceId(workspaceId: string): Promise<ImportBatch[]>;
  findPaged(
    workspaceId: string,
    page: PageOptions,
  ): Promise<PagedResult<ImportBatch>>;
  findByBatchHash(
    workspaceId: string,
    batchHash: string,
  ): Promise<ImportBatch | undefined>;
  delete(id: string): Promise<void>;
}
