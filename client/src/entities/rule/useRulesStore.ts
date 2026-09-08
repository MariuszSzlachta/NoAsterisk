import { create } from 'zustand';

import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import { encryptedPersistence } from '#shared/adapters/persistence/session';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

import type { RuleRecord } from './types';

const ruleRepository = encryptedPersistence.repository<RuleRecord>(
  'rules',
  (value: unknown): value is RuleRecord =>
    isRecord(value) &&
    recordGuards.hasString(value, 'id') &&
    recordGuards.hasString(value, 'keyword') &&
    (value.matcherType === 'Contains' || value.matcherType === 'Exact') &&
    recordGuards.hasString(value, 'categoryId') &&
    recordGuards.hasFiniteNumber(value, 'priority') &&
    recordGuards.hasString(value, 'createdAt'),
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

const isValidRulePayload = (
  rule: Omit<RuleRecord, 'id' | 'createdAt'>,
): boolean =>
  rule.keyword.trim().length > 0 &&
  rule.categoryId.trim().length > 0 &&
  (rule.matcherType === 'Contains' || rule.matcherType === 'Exact') &&
  Number.isFinite(rule.priority) &&
  rule.priority >= 1;

const isValidRuleUpdate = (
  updates: Partial<Pick<RuleRecord, 'keyword' | 'matcherType' | 'categoryId' | 'priority'>>,
): boolean =>
  (updates.keyword === undefined || updates.keyword.trim().length > 0) &&
  (updates.matcherType === undefined ||
    updates.matcherType === 'Contains' ||
    updates.matcherType === 'Exact') &&
  (updates.categoryId === undefined || updates.categoryId.trim().length > 0) &&
  (updates.priority === undefined ||
    (Number.isFinite(updates.priority) && updates.priority >= 1));

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
    const next = current.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule,
    );
    set({ rules: next });
    const updated = next.find((rule) => rule.id === id);
    if (updated !== undefined) {
      persistInBackground(ruleRepository.put(updated));
    }
  },

  deleteRule: (id) => {
    set((state) => ({ rules: state.rules.filter((rule) => rule.id !== id) }));
    persistInBackground(ruleRepository.delete(id));
  },
}));
