import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_BATCH_REPOSITORY,
  ImportBatchRepository,
} from '@imports/application/ports/import-batch.repository';
import { ImportBatchResponseDto } from '@imports/application/dto/import-batch-response.dto';
import { ImportBatchResponseMapper } from '@imports/application/mappers/import-batch-response.mapper';

export interface GetImportBatchByIdQuery {
  workspaceId: string;
  id: string;
}

@Injectable()
export class GetImportBatchByIdHandler {
  constructor(
    @Inject(IMPORT_BATCH_REPOSITORY)
    private readonly repo: ImportBatchRepository,
  ) {}

  async execute(
    query: GetImportBatchByIdQuery,
  ): Promise<ImportBatchResponseDto | undefined> {
    const batch = await this.repo.findById(query.id);

    if (!batch || batch.workspaceId !== query.workspaceId) {
      return undefined;
    }

    return ImportBatchResponseMapper.toDto(batch);
  }
}
