import { create } from 'zustand';

import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { isRuleRecord } from '#features/admin-rules/model/is-rule-record';
import { isValidRulePayload } from '#features/admin-rules/store/useRulesStore/is-valid-rule-payload';
import { isValidRuleUpdate } from '#features/admin-rules/store/useRulesStore/is-valid-rule-update';
import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const ruleRepository = encryptedPersistence.repository<RuleRecord>(
  'rules',
  isRuleRecord,
  (record) => record.id,
);

interface RulesState {
  readonly rules: ReadonlyArray<RuleRecord>;
  readonly addRule: (rule: Omit<RuleRecord, 'id' | 'createdAt'>) => void;
  readonly updateRule: (
    id: string,
    updates: Partial<Pick<RuleRecord, 'keyword' | 'matcherType' | 'categoryId' | 'priority'>>,
  ) => void;
  readonly deleteRule: (id: string) => void;
}

export const useRulesStore = create<RulesState>()((set) => ({
  rules: [],

  addRule: (rule) => {
    if (!isValidRulePayload(rule)) {
      return;
    }

    const created: RuleRecord = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ rules: [...state.rules, created] }));
    persistInBackground(ruleRepository.put(created));
  },

  updateRule: (id, updates) => {
    if (!isValidRuleUpdate(updates)) {
      return;
    }

    const current = useRulesStore.getState().rules;
    const next = current.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule));
    set({ rules: next });
    const updated = next.find((rule) => rule.id === id);
    if (updated) {
      persistInBackground(ruleRepository.put(updated));
    }
  },

  deleteRule: (id) => {
    set((state) => ({ rules: state.rules.filter((rule) => rule.id !== id) }));
    persistInBackground(ruleRepository.delete(id));
  },
}));
