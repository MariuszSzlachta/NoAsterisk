// ─── Types ───────────────────────────────────────────────────────

interface RuleFormInput {
  readonly keyword: string;
  readonly categoryId: string;
  readonly priority: number;
}

export interface RuleFormErrors {
  readonly keyword?: string;
  readonly categoryId?: string;
  readonly priority?: string;
}

// ─── Validator ───────────────────────────────────────────────────

export const validateRuleForm = (input: RuleFormInput): RuleFormErrors => {
  const keyword = input.keyword.trim() === '' ? 'rules.form.errors.keywordRequired' : undefined;
  const categoryId = input.categoryId === '' ? 'rules.form.errors.categoryRequired' : undefined;
  const priority = !Number.isFinite(input.priority) || input.priority < 1
    ? 'rules.form.errors.priorityMin'
    : undefined;

  return {
    ...(keyword && { keyword }),
    ...(categoryId && { categoryId }),
    ...(priority && { priority }),
  };
};

export const hasRuleFormErrors = (errors: RuleFormErrors): boolean =>
  Object.values(errors).some(Boolean);
