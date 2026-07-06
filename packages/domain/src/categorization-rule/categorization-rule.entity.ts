import { DomainError } from '#domain/shared/domain-error';
import { generateId } from '#domain/shared/identifier';
import { MatcherType } from '#domain/categorization-rule/matcher-type.enum';
import { MATCHERS } from '#domain/categorization-rule/matchers';

export class CategorizationRule {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly keyword: string,
    public readonly categoryId: string,
    public readonly matcherType: MatcherType,
    public readonly priority: number,
    public readonly createdAt: Date,
  ) {
    if (!id) {
      throw new DomainError('CategorizationRule ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('CategorizationRule workspaceId cannot be empty');
    }
    if (!keyword.trim()) {
      throw new DomainError('CategorizationRule keyword cannot be empty');
    }
    if (keyword.length > 255) {
      throw new DomainError(
        'CategorizationRule keyword cannot exceed 255 characters',
      );
    }
    if (!categoryId) {
      throw new DomainError('CategorizationRule categoryId cannot be empty');
    }
    if (priority < 0) {
      throw new DomainError('CategorizationRule priority cannot be negative');
    }
  }

  static create(props: {
    workspaceId: string;
    keyword: string;
    categoryId: string;
    matcherType: MatcherType;
    priority?: number;
  }): CategorizationRule {
    return new CategorizationRule(
      generateId(),
      props.workspaceId,
      props.keyword.trim(),
      props.categoryId,
      props.matcherType,
      props.priority ?? 0,
      new Date(),
    );
  }

  update(props: {
    keyword?: string;
    categoryId?: string;
    matcherType?: MatcherType;
    priority?: number;
  }): CategorizationRule {
    return new CategorizationRule(
      this.id,
      this.workspaceId,
      props.keyword?.trim() ?? this.keyword,
      props.categoryId ?? this.categoryId,
      props.matcherType ?? this.matcherType,
      props.priority ?? this.priority,
      this.createdAt,
    );
  }

  matches(description: string): boolean {
    return MATCHERS[this.matcherType].matches(description, this.keyword);
  }
}
