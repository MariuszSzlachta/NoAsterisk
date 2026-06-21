import { Module } from '@nestjs/common';
import { CATEGORIZATION_RULE_REPOSITORY } from '@categorization-rules/application/ports/categorization-rule.repository';
import { InMemoryCategorizationRuleRepository } from '@categorization-rules/infrastructure/in-memory-categorization-rule.repository';
import { CreateRuleHandler } from '@categorization-rules/application/commands/create-rule.handler';
import { UpdateRuleHandler } from '@categorization-rules/application/commands/update-rule.handler';
import { DeleteRuleHandler } from '@categorization-rules/application/commands/delete-rule.handler';
import { AutoCategorizeHandler } from '@categorization-rules/application/commands/auto-categorize.handler';
import { GetRulesHandler } from '@categorization-rules/application/queries/get-rules.handler';
import { CategorizationRulesController } from '@categorization-rules/presentation/categorization-rules.controller';
import { CategoriesModule } from '@categories/categories.module';
import { TransactionsModule } from '@transactions/transactions.module';

@Module({
  imports: [CategoriesModule, TransactionsModule],
  controllers: [CategorizationRulesController],
  providers: [
    {
      provide: CATEGORIZATION_RULE_REPOSITORY,
      useClass: InMemoryCategorizationRuleRepository,
    },
    CreateRuleHandler,
    UpdateRuleHandler,
    DeleteRuleHandler,
    AutoCategorizeHandler,
    GetRulesHandler,
  ],
  exports: [CATEGORIZATION_RULE_REPOSITORY],
})
export class CategorizationRulesModule {}
