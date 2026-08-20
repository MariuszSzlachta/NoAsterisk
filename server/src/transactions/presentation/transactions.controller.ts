import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTransactionHandler } from '@transactions/application/commands/create-transaction.handler';
import { UpdateTransactionHandler } from '@transactions/application/commands/update-transaction.handler';
import { DeleteTransactionHandler } from '@transactions/application/commands/delete-transaction.handler';
import { GetTransactionByIdHandler } from '@transactions/application/queries/get-transaction-by-id.handler';
import { GetTransactionsPagedHandler } from '@transactions/application/queries/get-transactions-paged.handler';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from '@transactions/presentation/transaction.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';
import {
  PagedResult,
  SortDirection,
} from '@shared/application/types/paged-query.types';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/presentation/decorators/current-user.decorator';

const SORT_DIR_MAP: Record<'asc' | 'desc', SortDirection> = {
  asc: SortDirection.Asc,
  desc: SortDirection.Desc,
};

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createHandler: CreateTransactionHandler,
    private readonly updateHandler: UpdateTransactionHandler,
    private readonly deleteHandler: DeleteTransactionHandler,
    private readonly getByIdHandler: GetTransactionByIdHandler,
    private readonly getPagedHandler: GetTransactionsPagedHandler,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(CreateTransactionDto))
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.createHandler.execute({
      workspaceId: user.workspaceId,
      ...dto,
    });
  }

  @Get()
  async findPaged(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(TransactionQueryDto))
    query: TransactionQueryDto,
  ): Promise<PagedResult<TransactionResponseDto>> {
    return this.getPagedHandler.execute({
      workspaceId: user.workspaceId,
      paged: {
        page: { page: query.page, limit: query.limit },
        sort: { field: query.sortBy, direction: SORT_DIR_MAP[query.sortDir] },
        filter: {
          type: query.type,
          categoryIds: query.categoryIds,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          amountMin: query.amountMin,
          amountMax: query.amountMax,
          description: query.description,
        },
      },
    });
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<TransactionResponseDto> {
    return this.getByIdHandler.execute({ id, workspaceId: user.workspaceId });
  }

  @Put(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
    @Body(new ZodValidationPipe(UpdateTransactionDto))
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.updateHandler.execute({
      id,
      workspaceId: user.workspaceId,
      ...dto,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    return this.deleteHandler.execute({ id, workspaceId: user.workspaceId });
  }
}
