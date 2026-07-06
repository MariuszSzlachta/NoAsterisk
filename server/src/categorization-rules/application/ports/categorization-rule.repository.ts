import { CategorizationRule } from '@budget/domain';
import {
  PagedResult,
  PageOptions,
} from '@shared/application/types/paged-query.types';

export const CATEGORIZATION_RULE_REPOSITORY = Symbol(
  'CATEGORIZATION_RULE_REPOSITORY',
);

export interface CategorizationRuleRepository {
  save(rule: CategorizationRule): Promise<CategorizationRule>;
  findById(id: string): Promise<CategorizationRule | undefined>;
  findByWorkspaceId(workspaceId: string): Promise<CategorizationRule[]>;
  findPaged(
    workspaceId: string,
    page: PageOptions,
  ): Promise<PagedResult<CategorizationRule>>;
  delete(id: string): Promise<void>;
}
