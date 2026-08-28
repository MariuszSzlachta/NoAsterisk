import { describe, expect, it } from 'vitest';

import type { BudgetTransactionInput } from '#features/budgets/model/types/budget-transaction-input';

import { mapToTransactionVM } from '#features/budgets/model/map-to-transaction-vm';

describe('mapToTransactionVM', () => {
  it('maps all fields from input to VM', () => {
    const input: BudgetTransactionInput = {
      id: 'tx-1',
      date: '2026-06-15',
      description: 'BIEDRONKA',
      amount: -87.43,
      currency: 'PLN',
      budgetId: 'budget-1',
    };

    const result = mapToTransactionVM(input);

    expect(result).toEqual({
      id: 'tx-1',
      description: 'BIEDRONKA',
      amount: -87.43,
      currency: 'PLN',
      date: '2026-06-15',
    });
  });

  it('excludes budgetId from output', () => {
    const input: BudgetTransactionInput = {
      id: 'tx-1',
      date: '2026-06-15',
      description: 'TEST',
      amount: -50,
      currency: 'PLN',
      budgetId: 'budget-1',
    };

    const result = mapToTransactionVM(input);

    expect(result).not.toHaveProperty('budgetId');
  });
});
