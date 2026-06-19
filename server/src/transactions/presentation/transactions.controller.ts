import { Controller, Get, Post, Body, UsePipes } from '@nestjs/common';
import { CreateTransactionHandler } from '@transactions/application/commands/create-transaction.handler';
import { GetTransactionsHandler } from '@transactions/application/queries/get-transactions.handler';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';
import { CreateTransactionDto } from '@transactions/presentation/transaction.dto';
import { ZodValidationPipe } from '@transactions/presentation/zod-validation.pipe';

// TODO: Add JWT AuthGuard when auth module is implemented
// TODO: Add rate limiting (e.g., @Throttle()) on all endpoints
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createHandler: CreateTransactionHandler,
    private readonly getHandler: GetTransactionsHandler,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateTransactionDto))
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    // TODO: Extract userId/workspaceId from auth context and pass to handler
    return this.createHandler.execute(dto);
  }

  @Get()
  async findAll(): Promise<TransactionResponseDto[]> {
    // TODO: Filter by userId/workspaceId from auth context (ABAC ownership check)
    return this.getHandler.execute();
  }
}
