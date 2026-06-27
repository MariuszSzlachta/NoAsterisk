import { describe, expect, it } from 'vitest';

import { mapRecentTransactionDtoToVm } from '#features/dashboard-widgets/application/mappers/recent-transactions.mapper';
import type { RecentTransactionDto } from '#features/dashboard-widgets/infrastructure/api/useRecentTransactionsQuery';

describe('mapRecentTransactionDtoToVm', () => {
  it('maps all fields from DTO to VM', () => {
    const dto: RecentTransactionDto = {
      id: '1',
      merchant: 'BIEDRONKA',
      category: 'Zakupy',
      date: '27 cze',
      amount: '−87,43 zł',
      direction: 'expense',
    };

    const vm = mapRecentTransactionDtoToVm(dto);

    expect(vm).toEqual({
      id: '1',
      merchant: 'BIEDRONKA',
      category: 'Zakupy',
      date: '27 cze',
      amount: '−87,43 zł',
      direction: 'expense',
    });
  });

  it('handles income direction', () => {
    const dto: RecentTransactionDto = {
      id: '3',
      merchant: 'Przelew',
      category: 'Wynagrodzenie',
      date: '25 cze',
      amount: '+8 500,00 zł',
      direction: 'income',
    };

    const vm = mapRecentTransactionDtoToVm(dto);

    expect(vm.direction).toBe('income');
    expect(vm.amount).toBe('+8 500,00 zł');
  });
});
