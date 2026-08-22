import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { createHash } from 'node:crypto';
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
  /**
   * Per-process in-memory cache for GET /dictionaries response.
   * Limitation: in multi-instance deployments, writes on instance A do not
   * invalidate cache on instance B. Acceptable for low-mutation reference data.
   * For multi-instance: use Redis pub/sub or DB-level versioning.
   */
  private cachedAll: { data: DictionaryResponseDto; etag: string } | null =
    null;

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
  async getAll(
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<DictionaryResponseDto | undefined> {
    if (!this.cachedAll) {
      const data = await this.getAllHandler.execute();
      this.cachedAll = { data, etag: this.computeEtag(data) };
    }

    res.set('Cache-Control', 'public, max-age=86400');
    res.set('ETag', this.cachedAll.etag);

    if (ifNoneMatch === this.cachedAll.etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return undefined;
    }

    return this.cachedAll.data;
  }

  /**
   * No in-memory cache for per-type queries (intentional asymmetry with getAll):
   * - Per-type result is a subset of getAll, rarely called directly by frontend
   * - Adding per-type cache (Map<string, ...>) adds complexity for little gain
   * - ETag still works: repeated identical GETs return 304 via HTTP caching
   */
  @Public()
  @SkipThrottle()
  @Get(':type')
  async getByType(
    @Param('type') type: string,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<readonly string[] | undefined> {
    const data = await this.getByTypeHandler.execute(type);
    const etag = this.computeEtag(data);

    res.set('Cache-Control', 'public, max-age=86400');
    res.set('ETag', etag);

    if (ifNoneMatch === etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return undefined;
    }

    return data;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addEntry(
    @Body(new ZodValidationPipe(addEntrySchema)) dto: AddEntryDto,
  ): Promise<{ id: string; value: string }> {
    const result = await this.addEntryHandler.execute({
      type: dto.type,
      value: dto.value,
    });
    this.invalidateCache();
    return result;
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkImport(
    @Body(new ZodValidationPipe(bulkImportSchema)) dto: BulkImportDto,
  ): Promise<BulkImportResultDto> {
    const result = await this.bulkImportHandler.execute({
      type: dto.type,
      values: dto.values,
    });
    this.invalidateCache();
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEntry(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    await this.deleteEntryHandler.execute({ id });
    this.invalidateCache();
  }

  private invalidateCache(): void {
    this.cachedAll = null;
  }

  private computeEtag(data: DictionaryResponseDto | readonly string[]): string {
    const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `"${hash}"`;
  }
}
