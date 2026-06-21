import {
  ImportBatch,
  ImportBatchStatus,
} from '@imports/domain/import-batch.entity';
import { ImportBatchResponseDto } from '@imports/application/dto/import-batch-response.dto';

const STATUS_MAP: Record<ImportBatchStatus, ImportBatchResponseDto['status']> =
  {
    [ImportBatchStatus.Pending]: 'Pending',
    [ImportBatchStatus.InProgress]: 'InProgress',
    [ImportBatchStatus.Complete]: 'Complete',
    [ImportBatchStatus.PartiallyRejected]: 'PartiallyRejected',
  };

export class ImportBatchResponseMapper {
  static toDto(entity: ImportBatch): ImportBatchResponseDto {
    return {
      id: entity.id,
      batchHash: entity.batchHash,
      sourceFilename: entity.sourceFilename,
      totalRows: entity.totalRows,
      savedRows: entity.savedRows,
      status: STATUS_MAP[entity.status],
      importedAt: entity.importedAt.toISOString(),
      completedAt: entity.completedAt?.toISOString(),
    };
  }
}
