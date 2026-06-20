import {
  Controller,
  Post,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ImportTransactionsDto } from '@imports/presentation/import.dto';
import {
  ImportTransactionsHandler,
  ImportTransactionsResult,
  BatchAlreadyImportedError,
} from '@imports/application/commands/import-transactions.handler';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';

// TODO: Extract workspaceId from JWT token via @CurrentWorkspace() decorator
const TEMP_WORKSPACE_ID = 'ws-default';

@Controller('imports')
export class ImportsController {
  constructor(
    private readonly importHandler: ImportTransactionsHandler,
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
      // BatchAlreadyImportedError → 409 Conflict (not 400 from global DomainExceptionFilter)
      if (error instanceof BatchAlreadyImportedError) {
        res.status(HttpStatus.CONFLICT);
        return { status: 'rejected', reason: error.message };
      }
      throw error;
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
