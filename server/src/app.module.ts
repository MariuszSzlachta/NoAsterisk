import { Module } from '@nestjs/common';
import { TransactionsModule } from '@transactions/transactions.module';
import { CategoriesModule } from '@categories/categories.module';

@Module({
  imports: [TransactionsModule, CategoriesModule],
})
export class AppModule {}
