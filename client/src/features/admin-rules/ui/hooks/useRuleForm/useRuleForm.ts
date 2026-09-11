import { useState } from 'react';

import type {
  MatcherType,
  RuleRecord,
} from '#features/admin-rules/model/types';
import {
  hasRuleFormErrors,
  validateRuleForm,
  type RuleFormErrors,
} from '#features/admin-rules/model/validators';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { DEFAULT_FORM_VALUES } from '#features/admin-rules/ui/hooks/useRuleForm/default-form-values';

interface FormValues {
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly categoryId: string;
  readonly priority: number | '';
}

interface UseRuleFormResult {
  readonly formValues: FormValues;
  readonly errors: RuleFormErrors;
  readonly isEditing: boolean;
  readonly handleFieldChange: <TKey extends keyof FormValues>(
    field: TKey,
    value: FormValues[TKey],
  ) => void;
  readonly handleSubmit: () => void;
  readonly handleCancel: () => void;
}

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
  const [errors, setErrors] = useState<RuleFormErrors>({});

  const handleFieldChange = <TKey extends keyof FormValues>(
    field: TKey,
    value: FormValues[TKey],
  ): void => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (): void => {
    const validationErrors = validateRuleForm(formValues);
    setErrors(validationErrors);

    if (hasRuleFormErrors(validationErrors) || formValues.priority === '') {
      return;
    }

    const payload = {
      keyword: formValues.keyword.trim(),
      matcherType: formValues.matcherType,
      categoryId: formValues.categoryId,
      priority: formValues.priority,
    };

    if (editingRule) {
      updateRule(editingRule.id, payload);
      onClose();
      return;
    }

    addRule(payload);
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
