import { describe, expect, it } from 'vitest';

import { hasRuleFormErrors } from '#features/admin-rules/model/validators/has-rule-form-errors';

describe('hasRuleFormErrors', () => {
  it('returns false for empty errors object', () => {
    expect(hasRuleFormErrors({})).toBe(false);
  });

  it('returns true when keyword error exists', () => {
    expect(hasRuleFormErrors({ keyword: 'required' })).toBe(true);
  });

  it('returns true when categoryId error exists', () => {
    expect(hasRuleFormErrors({ categoryId: 'required' })).toBe(true);
  });

  it('returns true when priority error exists', () => {
    expect(hasRuleFormErrors({ priority: 'min' })).toBe(true);
  });

  it('returns false when all fields are undefined', () => {
    expect(hasRuleFormErrors({ keyword: undefined, categoryId: undefined, priority: undefined })).toBe(false);
  });
});
