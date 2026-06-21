import { MatcherType } from '@categorization-rules/domain/matcher-type.enum';

export interface CategorizationMatcher {
  matches(description: string, keyword: string): boolean;
}

export class ContainsMatcher implements CategorizationMatcher {
  matches(description: string, keyword: string): boolean {
    return description.toLowerCase().includes(keyword.toLowerCase());
  }
}

export class ExactMatcher implements CategorizationMatcher {
  matches(description: string, keyword: string): boolean {
    return description.toLowerCase() === keyword.toLowerCase();
  }
}

export const MATCHERS: Record<MatcherType, CategorizationMatcher> = {
  [MatcherType.Contains]: new ContainsMatcher(),
  [MatcherType.Exact]: new ExactMatcher(),
};
