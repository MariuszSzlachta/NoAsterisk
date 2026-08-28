import type { MatcherType } from '#features/admin-rules/model/matcher-type';

export const isMatcherType = (value: string): value is MatcherType =>
  value === 'Contains' || value === 'Exact';
