// ═══════════════════════════════════════════════════════════════════
// Admin Rules — useRuleForm Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

import type { MatcherType, RuleRecord } from '#features/admin-rules/model/types';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';

// ─── Types ───────────────────────────────────────────────────────

interface FormValues {
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly categoryId: string;
  readonly priority: number;
}

interface FormErrors {
  readonly keyword?: string;
  readonly categoryId?: string;
  readonly priority?: string;
}

interface UseRuleFormResult {
  readonly formValues: FormValues;
  readonly errors: FormErrors;
  readonly isEditing: boolean;
  readonly handleFieldChange: <TKey extends keyof FormValues>(
    field: TKey,
    value: FormValues[TKey],
  ) => void;
  readonly handleSubmit: () => void;
  readonly handleCancel: () => void;
}

// ─── Constants ───────────────────────────────────────────────────

const DEFAULT_FORM_VALUES: FormValues = {
  keyword: '',
  matcherType: 'Contains',
  categoryId: '',
  priority: 1,
};

// ─── Hook ────────────────────────────────────────────────────────

/**
 * Manages rule form state with validation.
 * Parent MUST use `key={editingRule?.id ?? 'new'}` to reset state when switching rules.
 */
export const useRuleForm = (
  editingRule: RuleRecord | undefined,
  onClose: () => void,
): UseRuleFormResult => {
  const addRule = useRulesStore((s) => s.addRule);
  const updateRule = useRulesStore((s) => s.updateRule);

  const initialValues: FormValues = editingRule
    ? {
        keyword: editingRule.keyword,
        matcherType: editingRule.matcherType,
        categoryId: editingRule.categoryId,
        priority: editingRule.priority,
      }
    : DEFAULT_FORM_VALUES;

  const [formValues, setFormValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleFieldChange = <TKey extends keyof FormValues>(
    field: TKey,
    value: FormValues[TKey],
  ): void => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const keywordError =
      formValues.keyword.trim() === '' ? 'Słowo kluczowe jest wymagane' : undefined;
    const categoryError =
      formValues.categoryId === '' ? 'Kategoria jest wymagana' : undefined;
    const priorityError =
      formValues.priority < 1 ? 'Priorytet musi być większy od 0' : undefined;

    const newErrors: FormErrors = {
      ...(keywordError ? { keyword: keywordError } : {}),
      ...(categoryError ? { categoryId: categoryError } : {}),
      ...(priorityError ? { priority: priorityError } : {}),
    };

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validate()) {
      return;
    }

    if (editingRule) {
      updateRule(editingRule.id, {
        keyword: formValues.keyword.trim(),
        matcherType: formValues.matcherType,
        categoryId: formValues.categoryId,
        priority: formValues.priority,
      });
    } else {
      addRule({
        keyword: formValues.keyword.trim(),
        matcherType: formValues.matcherType,
        categoryId: formValues.categoryId,
        priority: formValues.priority,
      });
    }

    onClose();
  };

  const handleCancel = (): void => {
    onClose();
  };

  return {
    formValues,
    errors,
    isEditing: editingRule !== undefined,
    handleFieldChange,
    handleSubmit,
    handleCancel,
  };
};
