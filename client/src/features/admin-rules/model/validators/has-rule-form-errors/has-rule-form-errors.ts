import type { RuleFormErrors } from '#features/admin-rules/model/validators/rule-form-errors';

export const hasRuleFormErrors = (errors: RuleFormErrors): boolean =>
  Object.values(errors).some(Boolean);
