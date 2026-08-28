import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { isValidRulePayload } from '#features/admin-rules/store/useRulesStore/is-valid-rule-payload';
import { isValidRuleUpdate } from '#features/admin-rules/store/useRulesStore/is-valid-rule-update';

interface RulesState {
  readonly rules: ReadonlyArray<RuleRecord>;
  readonly addRule: (rule: Omit<RuleRecord, 'id' | 'createdAt'>) => void;
  readonly updateRule: (
    id: string,
    updates: Partial<Pick<RuleRecord, 'keyword' | 'matcherType' | 'categoryId' | 'priority'>>,
  ) => void;
  readonly deleteRule: (id: string) => void;
}

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
