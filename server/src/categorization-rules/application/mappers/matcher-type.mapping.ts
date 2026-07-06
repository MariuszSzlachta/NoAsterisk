import { MatcherType } from '@budget/domain';

export type MatcherTypeDto = 'Contains' | 'Exact';

export const MATCHER_TYPE_TO_DOMAIN: Record<MatcherTypeDto, MatcherType> = {
  Contains: MatcherType.Contains,
  Exact: MatcherType.Exact,
};

export const MATCHER_TYPE_TO_DTO: Record<MatcherType, MatcherTypeDto> = {
  [MatcherType.Contains]: 'Contains',
  [MatcherType.Exact]: 'Exact',
};
