import { describe, expect, it } from 'vitest';

import { validateRuleForm } from '#features/admin-rules/model/validators/validate-rule-form';

describe('validateRuleForm', () => {
  const validInput = {
    keyword: 'BIEDRONKA',
    categoryId: 'cat-groceries',
    priority: 1,
  };

  it('returns empty errors for valid input', () => {
    const errors = validateRuleForm(validInput);
    expect(errors).toEqual({});
  });

  it('returns keyword error for empty keyword', () => {
    const errors = validateRuleForm({ ...validInput, keyword: '' });
    expect(errors.keyword).toBeDefined();
  });

  it('returns keyword error for whitespace-only keyword', () => {
    const errors = validateRuleForm({ ...validInput, keyword: '   ' });
    expect(errors.keyword).toBeDefined();
  });

  it('returns categoryId error for empty categoryId', () => {
    const errors = validateRuleForm({ ...validInput, categoryId: '' });
    expect(errors.categoryId).toBeDefined();
  });

  it('returns priority error for priority below 1', () => {
    const errors = validateRuleForm({ ...validInput, priority: 0 });
    expect(errors.priority).toBeDefined();
  });

  it('returns priority error for NaN priority', () => {
    const errors = validateRuleForm({ ...validInput, priority: NaN });
    expect(errors.priority).toBeDefined();
  });

  it('returns multiple errors simultaneously', () => {
    const errors = validateRuleForm({ keyword: '', categoryId: '', priority: 0 });
    expect(errors.keyword).toBeDefined();
    expect(errors.categoryId).toBeDefined();
    expect(errors.priority).toBeDefined();
  });
});
