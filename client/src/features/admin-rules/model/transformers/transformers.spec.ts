import { describe, expect, it } from 'vitest';

import type { CategoryInfo } from '#entities/category';

import { mapRuleToViewModel } from './transformers';
import type { RuleRecord } from '#features/admin-rules/model/types';

// ─── Test Helpers ────────────────────────────────────────────────

const TRANSLATIONS: Record<string, string> = {
  'rules.form.matcherContains': 'Zawiera',
  'rules.form.matcherExact': 'Dokładnie',
  'rules.fallbackCategory': 'Nieznana',
};

const mockT = (key: string): string => TRANSLATIONS[key] ?? key;

// ─── Test Builders ───────────────────────────────────────────────

const buildRule = (overrides: Partial<RuleRecord> = {}): RuleRecord => ({
  id: 'rule-1',
  keyword: 'BIEDRONKA',
  matcherType: 'Contains',
  categoryId: 'cat-groceries',
  priority: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const STUB_CATEGORIES: ReadonlyArray<CategoryInfo> = [
  { id: 'cat-groceries', label: 'Spożywcze', color: '#4ade80' },
  { id: 'cat-transport', label: 'Transport', color: '#f59e0b' },
];

// ─── Tests ───────────────────────────────────────────────────────

describe('mapRuleToViewModel', () => {
  it('maps rule record to view model with matching category', () => {
    const rule = buildRule();

    const result = mapRuleToViewModel(rule, STUB_CATEGORIES, mockT);

    expect(result).toEqual({
      id: 'rule-1',
      keyword: 'BIEDRONKA',
      matcherType: 'Contains',
      matcherLabel: 'Zawiera',
      categoryId: 'cat-groceries',
      categoryLabel: 'Spożywcze',
      categoryColor: '#4ade80',
      priority: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('uses fallback label and color when category not found', () => {
    const rule = buildRule({ categoryId: 'cat-nonexistent' });

    const result = mapRuleToViewModel(rule, STUB_CATEGORIES, mockT);

    expect(result.categoryLabel).toBe('Nieznana');
    expect(result.categoryColor).toBe('#94a3b8');
  });

  it('maps Exact matcher type to correct label', () => {
    const rule = buildRule({ matcherType: 'Exact' });

    const result = mapRuleToViewModel(rule, STUB_CATEGORIES, mockT);

    expect(result.matcherLabel).toBe('Dokładnie');
  });

  it('maps Contains matcher type to correct label', () => {
    const rule = buildRule({ matcherType: 'Contains' });

    const result = mapRuleToViewModel(rule, STUB_CATEGORIES, mockT);

    expect(result.matcherLabel).toBe('Zawiera');
  });
});
