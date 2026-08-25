import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RuleRecord } from '#features/admin-rules/model/types';
import { isMatcherType } from '#features/admin-rules/model/types';

// ─── Validation ──────────────────────────────────────────────────

const isValidRulePayload = (
  rule: Omit<RuleRecord, 'id' | 'createdAt'>,
): boolean =>
  rule.keyword.trim().length > 0 &&
  rule.categoryId.trim().length > 0 &&
  isMatcherType(rule.matcherType) &&
  Number.isFinite(rule.priority) &&
  rule.priority >= 1;

const isValidRuleUpdate = (
  updates: Partial<Pick<RuleRecord, 'keyword' | 'matcherType' | 'categoryId' | 'priority'>>,
): boolean => {
  if (updates.keyword !== undefined && updates.keyword.trim().length === 0) return false;
  if (updates.matcherType !== undefined && !isMatcherType(updates.matcherType)) return false;
  if (updates.categoryId !== undefined && updates.categoryId.trim().length === 0) return false;
  if (updates.priority !== undefined && (!Number.isFinite(updates.priority) || updates.priority < 1)) return false;
  return true;
};

// ─── State Interface ─────────────────────────────────────────────

interface RulesState {
  readonly rules: ReadonlyArray<RuleRecord>;
  readonly addRule: (rule: Omit<RuleRecord, 'id' | 'createdAt'>) => void;
  readonly updateRule: (
    id: string,
    updates: Partial<Pick<RuleRecord, 'keyword' | 'matcherType' | 'categoryId' | 'priority'>>,
  ) => void;
  readonly deleteRule: (id: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useRulesStore = create<RulesState>()(
  persist(
    (set) => ({
      rules: [],

      addRule: (rule) => {
        if (!isValidRulePayload(rule)) {
          return;
        }

        set((state) => ({
          rules: [
            ...state.rules,
            {
              ...rule,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      updateRule: (id, updates) => {
        if (!isValidRuleUpdate(updates)) {
          return;
        }

        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule,
          ),
        }));
      },

      deleteRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        })),
    }),
    {
      name: 'budget-rules',
    },
  ),
);
