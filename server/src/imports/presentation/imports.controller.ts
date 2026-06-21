import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ImportTransactionsDto } from '@imports/presentation/import.dto';
import { importBatchQuerySchema, ImportBatchQueryDto } from '@imports/presentation/import-batch.dto';
import {
  ImportTransactionsHandler,
  ImportTransactionsResult,
  BatchAlreadyImportedError,
} from '@imports/application/commands/import-transactions.handler';
import { GetImportBatchesHandler } from '@imports/application/queries/get-import-batches.handler';
import { GetImportBatchByIdHandler } from '@imports/application/queries/get-import-batch-by-id.handler';
import { DeleteImportBatchHandler } from '@imports/application/commands/delete-import-batch.handler';
import { ImportBatchResponseDto } from '@imports/application/dto/import-batch-response.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';
import { PagedResult } from '@shared/application/types/paged-query.types';

// TODO: Extract workspaceId from JWT token via @CurrentWorkspace() decorator
const TEMP_WORKSPACE_ID = 'ws-default';

@Controller('imports')
export class ImportsController {
  constructor(
    private readonly importHandler: ImportTransactionsHandler,
    private readonly getBatchesHandler: GetImportBatchesHandler,
    private readonly getBatchByIdHandler: GetImportBatchByIdHandler,
    private readonly deleteBatchHandler: DeleteImportBatchHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(ImportTransactionsDto))
  async importTransactions(
    @Body() dto: ImportTransactionsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    try {
      const result = await this.importHandler.execute({
        batchId: dto.batchId,
        workspaceId: TEMP_WORKSPACE_ID,
        batchHash: dto.batchHash,
        sourceFilename: dto.sourceFilename,
        rows: dto.rows,
        isRetry: dto.isRetry,
      });

      return this.mapToResponse(result, res);
    } catch (error) {
      if (error instanceof BatchAlreadyImportedError) {
        res.status(HttpStatus.CONFLICT);
        return { status: 'rejected', reason: error.message };
      }
      throw error;
    }
  }

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(importBatchQuerySchema))
    query: ImportBatchQueryDto,
  ): Promise<PagedResult<ImportBatchResponseDto>> {
    return this.getBatchesHandler.execute({
      workspaceId: TEMP_WORKSPACE_ID,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async findById(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<ImportBatchResponseDto> {
    const result = await this.getBatchByIdHandler.execute({
      workspaceId: TEMP_WORKSPACE_ID,
      id,
    });

    if (!result) {
      throw new NotFoundException(`Import batch '${id}' not found`);
    }

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    const deleted = await this.deleteBatchHandler.execute({
      workspaceId: TEMP_WORKSPACE_ID,
      id,
    });

    if (!deleted) {
      throw new NotFoundException(`Import batch '${id}' not found`);
    }
  }

  private mapToResponse(
    result: ImportTransactionsResult,
    res: Response,
  ): unknown {
    if (result.rejected.length > 0) {
      res.status(HttpStatus.MULTI_STATUS);
      return {
        status: 'partial',
        saved: result.saved,
        duplicatesSkipped: result.duplicatesSkipped,
        rejected: result.rejected,
      };
    }

    return {
      status: 'accepted',
      saved: result.saved,
      duplicatesSkipped: result.duplicatesSkipped,
    };
  }
}
