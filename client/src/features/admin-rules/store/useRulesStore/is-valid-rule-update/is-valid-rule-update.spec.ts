import { describe, expect, it } from 'vitest';

import { isValidRuleUpdate } from '#features/admin-rules/store/useRulesStore/is-valid-rule-update';

describe('isValidRuleUpdate', () => {
  it('returns true for empty updates', () => {
    expect(isValidRuleUpdate({})).toBe(true);
  });

  it('returns true for valid keyword update', () => {
    expect(isValidRuleUpdate({ keyword: 'LIDL' })).toBe(true);
  });

  it('returns false for empty keyword', () => {
    expect(isValidRuleUpdate({ keyword: '' })).toBe(false);
  });

  it('returns false for whitespace-only keyword', () => {
    expect(isValidRuleUpdate({ keyword: '   ' })).toBe(false);
  });

  it('returns true for valid matcherType', () => {
    expect(isValidRuleUpdate({ matcherType: 'Exact' })).toBe(true);
  });

  it('returns false for invalid matcherType', () => {
    expect(isValidRuleUpdate({ matcherType: 'Invalid' as 'Contains' })).toBe(false);
  });

  it('returns true for valid categoryId', () => {
    expect(isValidRuleUpdate({ categoryId: 'cat-1' })).toBe(true);
  });

  it('returns false for empty categoryId', () => {
    expect(isValidRuleUpdate({ categoryId: '' })).toBe(false);
  });

  it('returns true for valid priority', () => {
    expect(isValidRuleUpdate({ priority: 5 })).toBe(true);
  });

  it('returns false for priority below 1', () => {
    expect(isValidRuleUpdate({ priority: 0 })).toBe(false);
  });

  it('returns false for NaN priority', () => {
    expect(isValidRuleUpdate({ priority: NaN })).toBe(false);
  });
});
