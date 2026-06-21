import { Module } from '@nestjs/common';
import { CATEGORIZATION_RULE_REPOSITORY } from '@categorization-rules/application/ports/categorization-rule.repository';
import { InMemoryCategorizationRuleRepository } from '@categorization-rules/infrastructure/in-memory-categorization-rule.repository';

@Module({
  providers: [
    {
      provide: CATEGORIZATION_RULE_REPOSITORY,
      useClass: InMemoryCategorizationRuleRepository,
    },
  ],
  exports: [CATEGORIZATION_RULE_REPOSITORY],
})
export class CategorizationRulesModule {}
