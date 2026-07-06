import { CategorizationRule } from '@budget/domain';
import { CategorizationRuleResponseDto } from '@categorization-rules/application/dto/categorization-rule-response.dto';
import { MATCHER_TYPE_TO_DTO } from '@categorization-rules/application/mappers/matcher-type.mapping';

export class CategorizationRuleResponseMapper {
  static toDto(entity: CategorizationRule): CategorizationRuleResponseDto {
    return {
      id: entity.id,
      keyword: entity.keyword,
      categoryId: entity.categoryId,
      matcherType: MATCHER_TYPE_TO_DTO[entity.matcherType],
      priority: entity.priority,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
