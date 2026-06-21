import { DomainError } from '@shared/domain/domain.error';

export enum MatcherType {
  Contains = 'Contains',
  Exact = 'Exact',
}

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
      throw new DomainError('CategorizationRule keyword cannot exceed 255 characters');
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
      crypto.randomUUID(),
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
    const normalizedDesc = description.toLowerCase();
    const normalizedKeyword = this.keyword.toLowerCase();

    switch (this.matcherType) {
      case MatcherType.Contains:
        return normalizedDesc.includes(normalizedKeyword);
      case MatcherType.Exact:
        return normalizedDesc === normalizedKeyword;
      default: {
        const _exhaustive: never = this.matcherType;
        throw new DomainError(`Unknown matcher type: ${_exhaustive}`);
      }
    }
  }
}
