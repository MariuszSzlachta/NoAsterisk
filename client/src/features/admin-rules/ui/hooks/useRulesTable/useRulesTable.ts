import { useTranslation } from 'react-i18next';

import { STUB_CATEGORIES } from '#entities/category';
import { mapRuleToViewModel } from '#features/admin-rules/model';
import type { RuleViewModel } from '#features/admin-rules/model/types';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';

interface UseRulesTableResult {
  readonly rules: ReadonlyArray<RuleViewModel>;
  readonly handleDelete: (id: string) => void;
}

export const useRulesTable = (): UseRulesTableResult => {
  const { t } = useTranslation();
  const rules = useRulesStore((s) => s.rules);
  const deleteRule = useRulesStore((s) => s.deleteRule);

  const viewModels = rules.map((rule) => mapRuleToViewModel(rule, STUB_CATEGORIES, t));

  const handleDelete = (id: string): void => {
    deleteRule(id);
  };

  return {
    rules: viewModels,
    handleDelete,
  };
};
