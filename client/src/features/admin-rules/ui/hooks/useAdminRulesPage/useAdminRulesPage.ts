// ═══════════════════════════════════════════════════════════════════
// Admin Rules — useAdminRulesPage Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import type { RuleRecord } from '#features/admin-rules/model/types';
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

  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | undefined>(undefined);

  const editingRule = editingRuleId
    ? rules.find((r) => r.id === editingRuleId)
    : undefined;

  const handleAddRule = (): void => {
    setEditingRuleId(undefined);
    setShowForm(true);
  };

  const handleEditRule = (id: string): void => {
    setEditingRuleId(id);
    setShowForm(true);
  };

  const handleCloseForm = (): void => {
    setShowForm(false);
    setEditingRuleId(undefined);
  };

  return {
    showForm,
    editingRule,
    lastResult,
    handleAddRule,
    handleEditRule,
    handleCloseForm,
    handleApplyRules,
  };
};
