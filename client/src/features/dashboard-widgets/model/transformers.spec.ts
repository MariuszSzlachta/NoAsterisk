import React from 'react';
import { describe, expect, it } from 'vitest';

import type { BudgetDto, KpiDto, RecentTransactionDto } from '#features/dashboard-widgets/model/types';

import { mapBudgetDtoToVm, mapKpiDtoToVm, mapRecentTransactionDtoToVm } from './transformers';

const STUB_ICON = React.createElement('span', null, 'icon');

describe('mapKpiDtoToVm', () => {
  it('maps label, value, delta, trend from DTO', () => {
    const dto: KpiDto = { id: 'balance', label: 'Saldo', value: '12 450,00 zł', deltaPercent: '+2,4%', trend: 'up' };

    const vm = mapKpiDtoToVm(dto, STUB_ICON, '/reports/balance');

    expect(vm.label).toBe('Saldo');
    expect(vm.value).toBe('12 450,00 zł');
    expect(vm.delta).toBe('+2,4%');
    expect(vm.trend).toBe('up');
  });

  it('assigns the provided icon', () => {
    const dto: KpiDto = { id: 'balance', label: 'Saldo', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto, STUB_ICON, undefined);

    expect(vm.icon).toBe(STUB_ICON);
  });

  it('assigns the provided iconHref', () => {
    const dto: KpiDto = { id: 'income', label: 'Przychody', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto, STUB_ICON, '/reports/income');

    expect(vm.iconHref).toBe('/reports/income');
  });

  it('handles missing optional fields', () => {
    const dto: KpiDto = { id: 'savings', label: 'Oszczędności', value: '2 450,00 zł' };

    const vm = mapKpiDtoToVm(dto, STUB_ICON, undefined);

    expect(vm.delta).toBeUndefined();
    expect(vm.trend).toBeUndefined();
  });

  it('passes tooltip through from DTO', () => {
    const dto: KpiDto = { id: 'balance', label: 'Saldo', value: '1 zł', tooltip: 'Opis metryki' };

    const vm = mapKpiDtoToVm(dto, STUB_ICON, '/reports/balance');

    expect(vm.tooltip).toBe('Opis metryki');
  });

  it('sets tooltip to undefined when not provided', () => {
    const dto: KpiDto = { id: 'balance', label: 'Saldo', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto, STUB_ICON, undefined);

    expect(vm.tooltip).toBeUndefined();
  });
});

describe('mapBudgetDtoToVm', () => {
  it('maps all fields from DTO to VM', () => {
    const dto: BudgetDto = { label: 'Zakupy', spent: 1850, limit: 2000, color: 'var(--cat-groceries)' };

    const vm = mapBudgetDtoToVm(dto);

    expect(vm).toEqual({ label: 'Zakupy', spent: 1850, limit: 2000, color: 'var(--cat-groceries)' });
  });

  it('preserves zero values', () => {
    const dto: BudgetDto = { label: 'Nowy', spent: 0, limit: 500, color: 'var(--primary)' };

    const vm = mapBudgetDtoToVm(dto);

    expect(vm.spent).toBe(0);
    expect(vm.limit).toBe(500);
  });
});

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
