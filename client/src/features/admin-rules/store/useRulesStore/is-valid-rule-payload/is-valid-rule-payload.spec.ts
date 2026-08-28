import { describe, expect, it } from 'vitest';

import { isValidRulePayload } from '#features/admin-rules/store/useRulesStore/is-valid-rule-payload';

describe('isValidRulePayload', () => {
  const validPayload = {
    keyword: 'BIEDRONKA',
    matcherType: 'Contains' as const,
    categoryId: 'cat-groceries',
    priority: 1,
  };

  it('returns true for valid payload', () => {
    expect(isValidRulePayload(validPayload)).toBe(true);
  });

  it('returns false for empty keyword', () => {
    expect(isValidRulePayload({ ...validPayload, keyword: '' })).toBe(false);
  });

  it('returns false for whitespace-only keyword', () => {
    expect(isValidRulePayload({ ...validPayload, keyword: '   ' })).toBe(false);
  });

  it('returns false for empty categoryId', () => {
    expect(isValidRulePayload({ ...validPayload, categoryId: '' })).toBe(false);
  });

  it('returns false for invalid matcherType', () => {
    expect(isValidRulePayload({ ...validPayload, matcherType: 'Invalid' as 'Contains' })).toBe(false);
  });

  it('returns false for priority below 1', () => {
    expect(isValidRulePayload({ ...validPayload, priority: 0 })).toBe(false);
  });

  it('returns false for NaN priority', () => {
    expect(isValidRulePayload({ ...validPayload, priority: NaN })).toBe(false);
  });

  it('returns false for Infinity priority', () => {
    expect(isValidRulePayload({ ...validPayload, priority: Infinity })).toBe(false);
  });
});
