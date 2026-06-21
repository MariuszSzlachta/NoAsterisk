import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_BATCH_REPOSITORY,
  ImportBatchRepository,
} from '@imports/application/ports/import-batch.repository';
import { ImportBatchResponseDto } from '@imports/application/dto/import-batch-response.dto';
import { ImportBatchResponseMapper } from '@imports/application/mappers/import-batch-response.mapper';
import { PagedResult } from '@shared/application/types/paged-query.types';

export interface GetImportBatchesQuery {
  workspaceId: string;
  page: number;
  limit: number;
}

@Injectable()
export class GetImportBatchesHandler {
  constructor(
    @Inject(IMPORT_BATCH_REPOSITORY)
    private readonly repo: ImportBatchRepository,
  ) {}

  async execute(
    query: GetImportBatchesQuery,
  ): Promise<PagedResult<ImportBatchResponseDto>> {
    const result = await this.repo.findPaged(query.workspaceId, {
      page: query.page,
      limit: query.limit,
    });

    return {
      data: result.data.map(ImportBatchResponseMapper.toDto),
      meta: result.meta,
    };
  }
}
