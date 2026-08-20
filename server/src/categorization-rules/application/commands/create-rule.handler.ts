import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  CATEGORIZATION_RULE_REPOSITORY,
  CategorizationRuleRepository,
} from '@categorization-rules/application/ports/categorization-rule.repository';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '@categories/application/ports/category.repository';
import { CategorizationRule } from '@budget/domain';
import { CategorizationRuleResponseDto } from '@categorization-rules/application/dto/categorization-rule-response.dto';
import { CategorizationRuleResponseMapper } from '@categorization-rules/application/mappers/categorization-rule-response.mapper';
import {
  MATCHER_TYPE_TO_DOMAIN,
  MatcherTypeDto,
} from '@categorization-rules/application/mappers/matcher-type.mapping';

export interface CreateRuleCommand {
  workspaceId: string;
  keyword: string;
  categoryId: string;
  matcherType: MatcherTypeDto;
  priority?: number;
}

@Injectable()
export class CreateRuleHandler {
  constructor(
    @Inject(CATEGORIZATION_RULE_REPOSITORY)
    private readonly repo: CategorizationRuleRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async execute(
    command: CreateRuleCommand,
  ): Promise<CategorizationRuleResponseDto> {
    const category = await this.categoryRepo.findById(command.categoryId);
    if (!category || category.workspaceId !== command.workspaceId) {
      throw new BadRequestException(
        `Category '${command.categoryId}' not found`,
      );
    }

    const rule = CategorizationRule.create({
      workspaceId: command.workspaceId,
      keyword: command.keyword,
      categoryId: command.categoryId,
      matcherType: MATCHER_TYPE_TO_DOMAIN[command.matcherType],
      priority: command.priority,
    });
    const saved = await this.repo.save(rule);
    return CategorizationRuleResponseMapper.toDto(saved);
  }
}
