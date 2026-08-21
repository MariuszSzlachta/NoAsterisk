// ═══════════════════════════════════════════════════════════════════
// Admin Rules Feature — Rules Store
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RuleRecord } from '#features/admin-rules/model/types';

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

      addRule: (rule) =>
        set((state) => ({
          rules: [
            ...state.rules,
            {
              ...rule,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateRule: (id, updates) =>
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule,
          ),
        })),

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
