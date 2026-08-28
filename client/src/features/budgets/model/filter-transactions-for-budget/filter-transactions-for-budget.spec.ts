import { parseISO } from 'date-fns';
import { describe, expect, it } from 'vitest';

import type { BudgetTransactionInput } from '#features/budgets/model/types/budget-transaction-input';

import { filterTransactionsForBudget } from '#features/budgets/model/filter-transactions-for-budget';

const buildTx = (overrides?: Partial<BudgetTransactionInput>): BudgetTransactionInput => ({
  id: 'tx-1',
  date: '2026-06-15',
  description: 'TEST',
  amount: -100,
  currency: 'PLN',
  budgetId: 'budget-1',
  ...overrides,
});

describe('filterTransactionsForBudget', () => {
  const from = parseISO('2026-06-01');
  const to = parseISO('2026-06-30');

  it('returns transactions matching budgetId and within date range', () => {
    const txs = [buildTx()];
    expect(filterTransactionsForBudget(txs, 'budget-1', from, to)).toHaveLength(1);
  });

  it('excludes transactions with different budgetId', () => {
    const txs = [buildTx({ budgetId: 'other' })];
    expect(filterTransactionsForBudget(txs, 'budget-1', from, to)).toHaveLength(0);
  });

  it('excludes transactions before date range', () => {
    const txs = [buildTx({ date: '2026-05-31' })];
    expect(filterTransactionsForBudget(txs, 'budget-1', from, to)).toHaveLength(0);
  });

  it('excludes transactions after date range', () => {
    const txs = [buildTx({ date: '2026-07-01' })];
    expect(filterTransactionsForBudget(txs, 'budget-1', from, to)).toHaveLength(0);
  });

  it('includes transactions on boundary dates', () => {
    const txs = [
      buildTx({ id: '1', date: '2026-06-01' }),
      buildTx({ id: '2', date: '2026-06-15' }),
    ];
    expect(filterTransactionsForBudget(txs, 'budget-1', from, to)).toHaveLength(2);
  });
});
