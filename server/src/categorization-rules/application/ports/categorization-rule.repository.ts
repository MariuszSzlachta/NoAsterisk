import { CategorizationRule } from '@categorization-rules/domain/categorization-rule.entity';

export const CATEGORIZATION_RULE_REPOSITORY = Symbol('CATEGORIZATION_RULE_REPOSITORY');

export interface CategorizationRuleRepository {
  save(rule: CategorizationRule): Promise<CategorizationRule>;
  findById(id: string): Promise<CategorizationRule | undefined>;
  findByWorkspaceId(workspaceId: string): Promise<CategorizationRule[]>;
  delete(id: string): Promise<void>;
}
