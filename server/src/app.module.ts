import { Module } from '@nestjs/common';
import { TransactionsModule } from '@transactions/transactions.module';
import { CategoriesModule } from '@categories/categories.module';
import { ImportsModule } from '@imports/imports.module';
import { CategorizationRulesModule } from '@categorization-rules/categorization-rules.module';

@Module({
  imports: [
    TransactionsModule,
    CategoriesModule,
    ImportsModule,
    CategorizationRulesModule,
  ],
})
export class AppModule {}
