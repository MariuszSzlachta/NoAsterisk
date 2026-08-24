import type { RuleRecord } from '#features/admin-rules/model/types';
import { useRuleFormStore } from '#features/admin-rules/store/useRuleFormStore';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import type { ApplyResult } from '#features/admin-rules/ui/hooks/useApplyRules';
import { useApplyRules } from '#features/admin-rules/ui/hooks/useApplyRules';

// ─── Types ───────────────────────────────────────────────────────

interface UseAdminRulesPageResult {
  readonly showForm: boolean;
  readonly editingRule: RuleRecord | undefined;
  readonly lastResult: ApplyResult | undefined;
  readonly handleAddRule: () => void;
  readonly handleEditRule: (id: string) => void;
  readonly handleCloseForm: () => void;
  readonly handleApplyRules: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAdminRulesPage = (): UseAdminRulesPageResult => {
  const rules = useRulesStore((s) => s.rules);
  const { handleApplyRules, lastResult } = useApplyRules();

  const showForm = useRuleFormStore((s) => s.showForm);
  const editingRuleId = useRuleFormStore((s) => s.editingRuleId);
  const openAddForm = useRuleFormStore((s) => s.openAddForm);
  const openEditForm = useRuleFormStore((s) => s.openEditForm);
  const closeForm = useRuleFormStore((s) => s.closeForm);

  const editingRule = editingRuleId
    ? rules.find((r) => r.id === editingRuleId)
    : undefined;

  return {
    showForm,
    editingRule,
    lastResult,
    handleAddRule: openAddForm,
    handleEditRule: openEditForm,
    handleCloseForm: closeForm,
    handleApplyRules,
  };
};
