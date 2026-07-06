import { MatcherType } from '#domain/categorization-rule/matcher-type.enum';

export interface CategorizationMatcher {
  matches(description: string, keyword: string): boolean;
}

export class ContainsMatcher implements CategorizationMatcher {
  matches(description: string, keyword: string): boolean {
    if (!keyword) return false;
    return description.toLowerCase().includes(keyword.toLowerCase());
  }
}

export class ExactMatcher implements CategorizationMatcher {
  matches(description: string, keyword: string): boolean {
    if (!keyword) return false;
    return description.toLowerCase() === keyword.toLowerCase();
  }
}

export const MATCHERS: Record<MatcherType, CategorizationMatcher> = {
  [MatcherType.Contains]: new ContainsMatcher(),
  [MatcherType.Exact]: new ExactMatcher(),
};
