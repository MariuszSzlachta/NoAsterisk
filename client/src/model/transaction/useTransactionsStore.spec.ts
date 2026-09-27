// ═══════════════════════════════════════════════════════════════════
// Cross-feature transaction model — store tests
// ═══════════════════════════════════════════════════════════════════

import { afterEach, describe, expect, it } from 'vitest';

import { useRulesStore } from '#model/rule';
import type { CreateTransactionFormValues } from './types';

import { useTransactionsStore } from './useTransactionsStore';

// ─── Test Data Builders ──────────────────────────────────────────

const buildFormValues = (
  overrides?: Partial<CreateTransactionFormValues>,
): CreateTransactionFormValues => ({
  title: 'Kawa w kawiarni',
  amount: '12.50',
  date: '2026-08-20',
  type: 'expense',
  categoryId: '',
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────

describe('useTransactionsStore — addTransaction', () => {
  afterEach(() => {
    useTransactionsStore.getState().clear();
    useRulesStore.setState({ rules: [] });
  });

  it('increases store length by 1', () => {
    const initialCount = useTransactionsStore.getState().transactions.length;

    useTransactionsStore.getState().addTransaction(buildFormValues());

    expect(useTransactionsStore.getState().transactions.length).toBe(initialCount + 1);
  });

  it('returns created transaction with generated id', () => {
    const result = useTransactionsStore.getState().addTransaction(buildFormValues());

    expect(result.id).toBeDefined();
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('stores description from trimmed title', () => {
    const result = useTransactionsStore.getState().addTransaction(
      buildFormValues({ title: '  Biedronka  ' }),
    );

    expect(result.description).toBe('Biedronka');
  });

  it('stores negative amount for expense', () => {
    const result = useTransactionsStore.getState().addTransaction(
      buildFormValues({ type: 'expense', amount: '87.50' }),
    );

    expect(result.amount).toBe(-87.5);
  });

  it('stores positive amount for income', () => {
    const result = useTransactionsStore.getState().addTransaction(
      buildFormValues({ type: 'income', amount: '8500' }),
    );

    expect(result.amount).toBe(8500);
  });

  it('stores date as-is', () => {
    const result = useTransactionsStore.getState().addTransaction(
      buildFormValues({ date: '2026-08-15' }),
    );

    expect(result.date).toBe('2026-08-15');
  });

  it('stores categoryId when provided', () => {
    const result = useTransactionsStore.getState().addTransaction(
      buildFormValues({ categoryId: 'cat-groceries' }),
    );

    expect(result.categoryId).toBe('cat-groceries');
  });

  it('stores categoryId as undefined when empty string', () => {
    const result = useTransactionsStore.getState().addTransaction(
      buildFormValues({ categoryId: '' }),
    );

    expect(result.categoryId).toBeUndefined();
  });

  it('sets batchId to manual', () => {
    const result = useTransactionsStore.getState().addTransaction(buildFormValues());

    expect(result.batchId).toBe('manual');
  });

  it('generates contentHash', () => {
    const result = useTransactionsStore.getState().addTransaction(buildFormValues());

    expect(result.contentHash).toBeDefined();
    expect(result.contentHash.length).toBeGreaterThan(0);
  });

  it('sets importedAt as ISO timestamp', () => {
    const before = new Date().toISOString();
    const result = useTransactionsStore.getState().addTransaction(buildFormValues());
    const after = new Date().toISOString();

    expect(result.importedAt >= before).toBe(true);
    expect(result.importedAt <= after).toBe(true);
  });

  it('sets currency to PLN', () => {
    const result = useTransactionsStore.getState().addTransaction(buildFormValues());

    expect(result.currency).toBe('PLN');
  });

  it('persists transaction in store state', () => {
    const result = useTransactionsStore.getState().addTransaction(buildFormValues());

    const stored = useTransactionsStore.getState().transactions;
    expect(stored.find((tx) => tx.id === result.id)).toBeDefined();
  });

  it('generates unique ids for sequential calls', () => {
    const result1 = useTransactionsStore.getState().addTransaction(buildFormValues());
    const result2 = useTransactionsStore.getState().addTransaction(buildFormValues());

    expect(result1.id).not.toBe(result2.id);
  });

  describe('auto-categorize integration', () => {
    it('assigns categoryId when rule matches description', () => {
      useRulesStore.getState().addRule({
        keyword: 'kawiarni',
        matcherType: 'Contains',
        categoryId: 'cat-entertainment',
        priority: 1,
      });

      const result = useTransactionsStore.getState().addTransaction(
        buildFormValues({ title: 'Kawa w kawiarni', categoryId: '' }),
      );

      expect(result.categoryId).toBe('cat-entertainment');
    });

    it('does not override user-selected category', () => {
      useRulesStore.getState().addRule({
        keyword: 'kawiarni',
        matcherType: 'Contains',
        categoryId: 'cat-entertainment',
        priority: 1,
      });

      const result = useTransactionsStore.getState().addTransaction(
        buildFormValues({ title: 'Kawa w kawiarni', categoryId: 'cat-groceries' }),
      );

      expect(result.categoryId).toBe('cat-groceries');
    });

    it('leaves categoryId undefined when no rule matches', () => {
      useRulesStore.getState().addRule({
        keyword: 'biedronka',
        matcherType: 'Contains',
        categoryId: 'cat-groceries',
        priority: 1,
      });

      const result = useTransactionsStore.getState().addTransaction(
        buildFormValues({ title: 'Kawa w kawiarni', categoryId: '' }),
      );

      expect(result.categoryId).toBeUndefined();
    });

    it('selects highest priority rule when multiple match', () => {
      useRulesStore.getState().addRule({
        keyword: 'kawa',
        matcherType: 'Contains',
        categoryId: 'cat-groceries',
        priority: 1,
      });
      useRulesStore.getState().addRule({
        keyword: 'kawa',
        matcherType: 'Contains',
        categoryId: 'cat-entertainment',
        priority: 10,
      });

      const result = useTransactionsStore.getState().addTransaction(
        buildFormValues({ title: 'Kawa w kawiarni', categoryId: '' }),
      );

      expect(result.categoryId).toBe('cat-entertainment');
    });
  });
});
