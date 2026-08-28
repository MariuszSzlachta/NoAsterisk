import { MIN_PRIORITY } from '#features/admin-rules/model/min-priority';
import type { RuleFormErrors } from '#features/admin-rules/model/validators/rule-form-errors';
import type { RuleFormInput } from '#features/admin-rules/model/validators/rule-form-input';

export const validateRuleForm = (input: RuleFormInput): RuleFormErrors => {
  const keyword = input.keyword.trim() === '' ? 'rules.form.errors.keywordRequired' : undefined;
  const categoryId = input.categoryId === '' ? 'rules.form.errors.categoryRequired' : undefined;
  const priority = !Number.isFinite(input.priority) || input.priority < MIN_PRIORITY
    ? 'rules.form.errors.priorityMin'
    : undefined;

  return {
    ...(keyword && { keyword }),
    ...(categoryId && { categoryId }),
    ...(priority && { priority }),
  };
};
