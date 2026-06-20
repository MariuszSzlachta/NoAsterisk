import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
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

const SORT_DIR_MAP: Record<'asc' | 'desc', SortDirection> = {
  asc: SortDirection.Asc,
  desc: SortDirection.Desc,
};

// TODO: Add JWT AuthGuard when auth module is implemented
// TODO: Add rate limiting (e.g., @Throttle()) on all endpoints
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
  @UsePipes(new ZodValidationPipe(CreateTransactionDto))
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.createHandler.execute(dto);
  }

  @Get()
  async findPaged(
    @Query(new ZodValidationPipe(TransactionQueryDto))
    query: TransactionQueryDto,
  ): Promise<PagedResult<TransactionResponseDto>> {
    return this.getPagedHandler.execute({
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
    });
  }

  @Get(':id')
  async findById(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<TransactionResponseDto> {
    return this.getByIdHandler.execute(id);
  }

  @Put(':id')
  async update(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
    @Body(new ZodValidationPipe(UpdateTransactionDto))
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.updateHandler.execute({ id, ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    return this.deleteHandler.execute({ id });
  }
}
