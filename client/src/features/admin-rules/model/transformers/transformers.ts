import type { CategoryInfo } from '#entities/category';

import type { MatcherType, RuleRecord, RuleViewModel } from '#features/admin-rules/model/types';

// ─── Types ───────────────────────────────────────────────────────

type TranslationFn = (key: string) => string;

// ─── Constants ───────────────────────────────────────────────────

const MATCHER_LABEL_KEYS: Record<MatcherType, string> = {
  Contains: 'rules.form.matcherContains',
  Exact: 'rules.form.matcherExact',
};

const FALLBACK_CATEGORY_KEY = 'rules.fallbackCategory';
const FALLBACK_CATEGORY_COLOR = '#94a3b8'; // matches slate-400 — used as JS value for dynamic rendering

// ─── Transformer ─────────────────────────────────────────────────

export const mapRuleToViewModel = (
  record: RuleRecord,
  categories: ReadonlyArray<CategoryInfo>,
  t: TranslationFn,
): RuleViewModel => {
  const category = categories.find((c) => c.id === record.categoryId);

  return {
    id: record.id,
    keyword: record.keyword,
    matcherType: record.matcherType,
    matcherLabel: t(MATCHER_LABEL_KEYS[record.matcherType]) ?? record.matcherType,
    categoryId: record.categoryId,
    categoryLabel: category?.label ?? t(FALLBACK_CATEGORY_KEY),
    categoryColor: category?.color ?? FALLBACK_CATEGORY_COLOR,
    priority: record.priority,
    createdAt: record.createdAt,
  };
};
