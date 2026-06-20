import { Module } from '@nestjs/common';
import { TransactionsModule } from '@transactions/transactions.module';
import { CategoriesModule } from '@categories/categories.module';
import { ImportsModule } from '@imports/imports.module';

@Module({
  imports: [TransactionsModule, CategoriesModule, ImportsModule],
})
export class AppModule {}
