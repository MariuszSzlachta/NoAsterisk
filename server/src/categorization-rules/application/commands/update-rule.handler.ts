import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  CATEGORIZATION_RULE_REPOSITORY,
  CategorizationRuleRepository,
} from '@categorization-rules/application/ports/categorization-rule.repository';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '@categories/application/ports/category.repository';
import { CategorizationRuleResponseDto } from '@categorization-rules/application/dto/categorization-rule-response.dto';
import { CategorizationRuleResponseMapper } from '@categorization-rules/application/mappers/categorization-rule-response.mapper';
import {
  MATCHER_TYPE_TO_DOMAIN,
  MatcherTypeDto,
} from '@categorization-rules/application/mappers/matcher-type.mapping';

export interface UpdateRuleCommand {
  workspaceId: string;
  id: string;
  keyword?: string;
  categoryId?: string;
  matcherType?: MatcherTypeDto;
  priority?: number;
}

@Injectable()
export class UpdateRuleHandler {
  constructor(
    @Inject(CATEGORIZATION_RULE_REPOSITORY)
    private readonly repo: CategorizationRuleRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async execute(
    command: UpdateRuleCommand,
  ): Promise<CategorizationRuleResponseDto | undefined> {
    const existing = await this.repo.findById(command.id);
    if (!existing || existing.workspaceId !== command.workspaceId) {
      return undefined;
    }

    if (command.categoryId) {
      const category = await this.categoryRepo.findById(command.categoryId);
      if (!category || category.workspaceId !== command.workspaceId) {
        throw new BadRequestException(
          `Category '${command.categoryId}' not found`,
        );
      }
    }

    const updated = existing.update({
      keyword: command.keyword,
      categoryId: command.categoryId,
      matcherType: command.matcherType
        ? MATCHER_TYPE_TO_DOMAIN[command.matcherType]
        : undefined,
      priority: command.priority,
    });
    const saved = await this.repo.save(updated);
    return CategorizationRuleResponseMapper.toDto(saved);
  }
}
