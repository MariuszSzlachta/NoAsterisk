import type { MatcherType } from '#features/admin-rules/model/matcher-type';

export const MATCHER_LABEL_KEYS: Record<MatcherType, string> = {
  Contains: 'rules.form.matcherContains',
  Exact: 'rules.form.matcherExact',
};
