import { Module, forwardRef } from '@nestjs/common';
import { TRANSACTION_REPOSITORY } from '@transactions/application/ports/transaction.repository';
import { CreateTransactionHandler } from '@transactions/application/commands/create-transaction.handler';
import { UpdateTransactionHandler } from '@transactions/application/commands/update-transaction.handler';
import { DeleteTransactionHandler } from '@transactions/application/commands/delete-transaction.handler';
import { GetTransactionByIdHandler } from '@transactions/application/queries/get-transaction-by-id.handler';
import { GetTransactionsPagedHandler } from '@transactions/application/queries/get-transactions-paged.handler';
import { InMemoryTransactionRepository } from '@transactions/infrastructure/in-memory-transaction.repository';
import { CategoryUsageAdapter } from '@transactions/infrastructure/category-usage.adapter';
import { TransactionsController } from '@transactions/presentation/transactions.controller';
import { CategoriesModule } from '@categories/categories.module';
import { CATEGORY_USAGE_PORT } from '@categories/application/ports/category-usage.port';

@Module({
  imports: [forwardRef(() => CategoriesModule)],
  controllers: [TransactionsController],
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: InMemoryTransactionRepository,
    },
    {
      provide: CATEGORY_USAGE_PORT,
      useClass: CategoryUsageAdapter,
    },
    CreateTransactionHandler,
    UpdateTransactionHandler,
    DeleteTransactionHandler,
    GetTransactionByIdHandler,
    GetTransactionsPagedHandler,
  ],
  exports: [TRANSACTION_REPOSITORY, CATEGORY_USAGE_PORT],
})
export class TransactionsModule {}
