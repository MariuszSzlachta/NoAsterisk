import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@auth/presentation/decorators/public.decorator';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';
import { GetAllDictionariesHandler } from '@dictionaries/application/queries/get-all-dictionaries.handler';
import { GetDictionariesByTypeHandler } from '@dictionaries/application/queries/get-dictionaries-by-type.handler';
import { AddEntryHandler } from '@dictionaries/application/commands/add-entry.handler';
import { BulkImportHandler } from '@dictionaries/application/commands/bulk-import.handler';
import { DeleteEntryHandler } from '@dictionaries/application/commands/delete-entry.handler';
import { DictionaryResponseDto } from '@dictionaries/application/dto/dictionary-response.dto';
import { BulkImportResultDto } from '@dictionaries/application/dto/bulk-import-result.dto';
import {
  addEntrySchema,
  AddEntryDto,
} from '@dictionaries/presentation/dto/add-entry.dto';
import {
  bulkImportSchema,
  BulkImportDto,
} from '@dictionaries/presentation/dto/bulk-import.dto';

/**
 * Dictionary entries management.
 * Access: GET is @Public(), POST/DELETE requires authentication.
 * Any authenticated user (Member or Superuser) can mutate dictionaries —
 * these are shared reference data for PII anonymization, not sensitive financial data.
 * Accepted permanently: no role restriction on mutations.
 */
@Controller('dictionaries')
export class DictionariesController {
  constructor(
    private readonly getAllHandler: GetAllDictionariesHandler,
    private readonly getByTypeHandler: GetDictionariesByTypeHandler,
    private readonly addEntryHandler: AddEntryHandler,
    private readonly bulkImportHandler: BulkImportHandler,
    private readonly deleteEntryHandler: DeleteEntryHandler,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  async getAll(): Promise<DictionaryResponseDto> {
    return this.getAllHandler.execute();
  }

  @Public()
  @SkipThrottle()
  @Get(':type')
  async getByType(@Param('type') type: string): Promise<readonly string[]> {
    return this.getByTypeHandler.execute(type);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addEntry(
    @Body(new ZodValidationPipe(addEntrySchema)) dto: AddEntryDto,
  ): Promise<{ id: string; value: string }> {
    return this.addEntryHandler.execute({
      type: dto.type,
      value: dto.value,
    });
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkImport(
    @Body(new ZodValidationPipe(bulkImportSchema)) dto: BulkImportDto,
  ): Promise<BulkImportResultDto> {
    return this.bulkImportHandler.execute({
      type: dto.type,
      values: dto.values,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEntry(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    await this.deleteEntryHandler.execute({ id });
  }
}
