import { Module } from '@nestjs/common';
import { ImportsController } from '@imports/presentation/imports.controller';
import { ImportTransactionsHandler } from '@imports/application/commands/import-transactions.handler';
import { DeleteImportBatchHandler } from '@imports/application/commands/delete-import-batch.handler';
import { GetImportBatchesHandler } from '@imports/application/queries/get-import-batches.handler';
import { GetImportBatchByIdHandler } from '@imports/application/queries/get-import-batch-by-id.handler';
import { PiiValidationService } from '@imports/application/services/pii-validation.service';
import { IMPORT_BATCH_REPOSITORY } from '@imports/application/ports/import-batch.repository';
import { PII_RULES, PiiRule } from '@imports/application/ports/pii-rule.port';
import { InMemoryImportBatchRepository } from '@imports/infrastructure/in-memory-import-batch.repository';
import {
  IbanRule,
  CardNumberRule,
  PeselRule,
  EmailRule,
  PhoneRule,
} from '@imports/infrastructure/pii-rules';
import { TransactionsModule } from '@transactions/transactions.module';
import { CategorizationRulesModule } from '@categorization-rules/categorization-rules.module';
import { ImportProfilesModule } from '@import-profiles/import-profiles.module';
import { CategoriesModule } from '@categories/categories.module';

@Module({
  imports: [
    TransactionsModule,
    CategorizationRulesModule,
    ImportProfilesModule,
    CategoriesModule,
  ],
  controllers: [ImportsController],
  providers: [
    ImportTransactionsHandler,
    DeleteImportBatchHandler,
    GetImportBatchesHandler,
    GetImportBatchByIdHandler,
    PiiValidationService,
    {
      provide: IMPORT_BATCH_REPOSITORY,
      useClass: InMemoryImportBatchRepository,
    },
    {
      provide: PII_RULES,
      useFactory: (): PiiRule[] => [
        new IbanRule(),
        new CardNumberRule(),
        new PeselRule(),
        new EmailRule(),
        new PhoneRule(),
      ],
    },
  ],
})
export class ImportsModule {}
