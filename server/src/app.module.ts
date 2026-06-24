import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TransactionsModule } from '@transactions/transactions.module';
import { CategoriesModule } from '@categories/categories.module';
import { ImportsModule } from '@imports/imports.module';
import { CategorizationRulesModule } from '@categorization-rules/categorization-rules.module';
import { ImportProfilesModule } from '@import-profiles/import-profiles.module';
import { AuthModule } from '@auth/auth.module';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';
import { THROTTLE_DEFAULT } from '@shared/presentation/throttle.constants';

@Module({
  imports: [
    ThrottlerModule.forRoot([THROTTLE_DEFAULT]),
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    ImportsModule,
    CategorizationRulesModule,
    ImportProfilesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
