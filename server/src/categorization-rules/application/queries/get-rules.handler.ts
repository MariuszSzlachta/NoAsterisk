import { Injectable, Inject } from '@nestjs/common';
import {
  CATEGORIZATION_RULE_REPOSITORY,
  CategorizationRuleRepository,
} from '@categorization-rules/application/ports/categorization-rule.repository';
import { CategorizationRuleResponseDto } from '@categorization-rules/application/dto/categorization-rule-response.dto';
import { CategorizationRuleResponseMapper } from '@categorization-rules/application/mappers/categorization-rule-response.mapper';
import { PagedResult } from '@shared/application/types/paged-query.types';

export interface GetRulesQuery {
  workspaceId: string;
  page: number;
  limit: number;
}

@Injectable()
export class GetRulesHandler {
  constructor(
    @Inject(CATEGORIZATION_RULE_REPOSITORY)
    private readonly repo: CategorizationRuleRepository,
  ) {}

  async execute(
    query: GetRulesQuery,
  ): Promise<PagedResult<CategorizationRuleResponseDto>> {
    const result = await this.repo.findPaged(query.workspaceId, {
      page: query.page,
      limit: query.limit,
    });

    return {
      data: result.data.map(CategorizationRuleResponseMapper.toDto),
      meta: result.meta,
    };
  }
}
