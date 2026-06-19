import { Module } from '@nestjs/common';
import { TRANSACTION_REPOSITORY } from '@transactions/application/ports/transaction.repository';
import { CreateTransactionHandler } from '@transactions/application/commands/create-transaction.handler';
import { GetTransactionsHandler } from '@transactions/application/queries/get-transactions.handler';
import { InMemoryTransactionRepository } from '@transactions/infrastructure/in-memory-transaction.repository';
import { TransactionsController } from '@transactions/presentation/transactions.controller';

@Module({
  controllers: [TransactionsController],
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: InMemoryTransactionRepository,
    },
    CreateTransactionHandler,
    GetTransactionsHandler,
  ],
})
export class TransactionsModule {}
