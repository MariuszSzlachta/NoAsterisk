import { Module } from '@nestjs/common';
import { ImportsController } from '@imports/presentation/imports.controller';
import { ImportTransactionsHandler } from '@imports/application/commands/import-transactions.handler';
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

@Module({
  imports: [TransactionsModule],
  controllers: [ImportsController],
  providers: [
    ImportTransactionsHandler,
    PiiValidationService,
    { provide: IMPORT_BATCH_REPOSITORY, useClass: InMemoryImportBatchRepository },
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
