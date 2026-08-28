import type { CategoryInfo } from '#entities/category';

import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import type { RuleViewModel } from '#features/admin-rules/model/rule-view-model';
import { FALLBACK_CATEGORY_COLOR } from '#features/admin-rules/model/transformers/fallback-category-color';
import { FALLBACK_CATEGORY_KEY } from '#features/admin-rules/model/transformers/fallback-category-key';
import { MATCHER_LABEL_KEYS } from '#features/admin-rules/model/transformers/matcher-label-keys';
import type { TranslationFn } from '#features/admin-rules/model/transformers/translation-fn';

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
