// ═══════════════════════════════════════════════════════════════════
// Admin Rules Feature — Transformers
// ═══════════════════════════════════════════════════════════════════

import type { CategoryInfo } from '#entities/category';

import type { MatcherType, RuleRecord, RuleViewModel } from './types';

// ─── Constants ───────────────────────────────────────────────────

const MATCHER_LABELS: Record<MatcherType, string> = {
  Contains: 'Zawiera',
  Exact: 'Dokładnie',
};

const FALLBACK_CATEGORY_LABEL = 'Nieznana';
const FALLBACK_CATEGORY_COLOR = '#94a3b8'; // matches slate-400 — used as JS value for dynamic rendering

// ─── Transformer ─────────────────────────────────────────────────

export const mapRuleToViewModel = (
  record: RuleRecord,
  categories: ReadonlyArray<CategoryInfo>,
): RuleViewModel => {
  const category = categories.find((c) => c.id === record.categoryId);

  return {
    id: record.id,
    keyword: record.keyword,
    matcherType: record.matcherType,
    matcherLabel: MATCHER_LABELS[record.matcherType] ?? record.matcherType,
    categoryId: record.categoryId,
    categoryLabel: category?.label ?? FALLBACK_CATEGORY_LABEL,
    categoryColor: category?.color ?? FALLBACK_CATEGORY_COLOR,
    priority: record.priority,
    createdAt: record.createdAt,
  };
};
