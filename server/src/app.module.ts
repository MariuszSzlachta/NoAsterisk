import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TransactionsModule } from '@transactions/transactions.module';
import { CategoriesModule } from '@categories/categories.module';
import { ImportsModule } from '@imports/imports.module';
import { CategorizationRulesModule } from '@categorization-rules/categorization-rules.module';
import { AuthModule } from '@auth/auth.module';
import { THROTTLE_DEFAULT } from '@shared/presentation/throttle.constants';

@Module({
  imports: [
    ThrottlerModule.forRoot([THROTTLE_DEFAULT]),
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    ImportsModule,
    CategorizationRulesModule,
  ],
})
export class AppModule {}
