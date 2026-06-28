import React from 'react';
import { describe, expect, it } from 'vitest';

import type {
  BudgetDto,
  KpiDto,
  RecentTransactionDto,
} from '#features/dashboard-widgets/model/types';

import {
  formatAmount,
  getRateColor,
  groupCategoryTail,
  mapBudgetDtoToVm,
  mapKpiDtoToVm,
  mapRecentTransactionDtoToVm,
  toMonthlyAmount,
} from './transformers';

const STUB_ICON = React.createElement('span', null, 'icon');

describe('mapKpiDtoToVm', () => {
  it('maps label, value, delta, trend from DTO', () => {
    const dto: KpiDto = {
      id: 'balance',
      label: 'Saldo',
      value: '12 450,00 zł',
      deltaPercent: '+2,4%',
      trend: 'up',
    };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON, iconHref: '/analytics?metric=balance' });

    expect(vm.label).toBe('Saldo');
    expect(vm.value).toBe('12 450,00 zł');
    expect(vm.delta).toBe('+2,4%');
    expect(vm.trend).toBe('up');
  });

  it('assigns the provided icon', () => {
    const dto: KpiDto = { id: 'balance', label: 'Saldo', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON });

    expect(vm.icon).toBe(STUB_ICON);
  });

  it('assigns the provided iconHref', () => {
    const dto: KpiDto = { id: 'income', label: 'Przychody', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON, iconHref: '/analytics?metric=income' });

    expect(vm.iconHref).toBe('/analytics?metric=income');
  });

  it('handles missing optional fields', () => {
    const dto: KpiDto = {
      id: 'savings',
      label: 'Oszczędności',
      value: '2 450,00 zł',
    };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON });

    expect(vm.delta).toBeUndefined();
    expect(vm.trend).toBeUndefined();
  });

  it('passes tooltip through from DTO', () => {
    const dto: KpiDto = {
      id: 'balance',
      label: 'Saldo',
      value: '1 zł',
      tooltip: 'Opis metryki',
    };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON });

    expect(vm.tooltip).toBe('Opis metryki');
  });

  it('sets tooltip to undefined when not provided', () => {
    const dto: KpiDto = { id: 'balance', label: 'Saldo', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON });

    expect(vm.tooltip).toBeUndefined();
  });

  it('maps iconTooltip from config', () => {
    const dto: KpiDto = { id: 'balance', label: 'Saldo', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON, iconTooltip: 'Zobacz raport' });

    expect(vm.iconTooltip).toBe('Zobacz raport');
  });

  it('maps invertColor from config', () => {
    const dto: KpiDto = { id: 'expenses', label: 'Wydatki', value: '1 zł', trend: 'down' };

    const vm = mapKpiDtoToVm(dto, { icon: STUB_ICON, invertColor: true });

    expect(vm.invertColor).toBe(true);
  });
});

describe('mapBudgetDtoToVm', () => {
  it('maps all fields from DTO to VM', () => {
    const dto: BudgetDto = {
      label: 'Zakupy',
      spent: 1850,
      limit: 2000,
      color: 'var(--cat-groceries)',
    };

    const vm = mapBudgetDtoToVm(dto);

    expect(vm).toEqual({
      label: 'Zakupy',
      spent: 1850,
      limit: 2000,
      color: 'var(--cat-groceries)',
    });
  });

  it('preserves zero values', () => {
    const dto: BudgetDto = {
      label: 'Nowy',
      spent: 0,
      limit: 500,
      color: 'var(--primary)',
    };

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

describe('groupCategoryTail', () => {
  it('returns data unchanged when <= 6 items', () => {
    const data = [
      { label: 'A', value: 100 },
      { label: 'B', value: 90 },
    ];
    expect(groupCategoryTail(data)).toEqual(data);
  });

  it('groups items beyond top 6 into "Inne" bucket', () => {
    const data = Array.from({ length: 8 }, (_, i) => ({
      label: `Cat ${i}`,
      value: 100 - i * 10,
    }));

    const result = groupCategoryTail(data);

    expect(result).toHaveLength(7);
    expect(result[6].label).toBe('Inne (2 kategorii)');
    expect(result[6].value).toBe(40 + 30); // last two items: value 40, 30
  });

  it('sorts by value descending before grouping', () => {
    const data = [
      { label: 'Low', value: 10 },
      { label: 'High', value: 900 },
      { label: 'Mid1', value: 100 },
      { label: 'Mid2', value: 200 },
      { label: 'Mid3', value: 300 },
      { label: 'Mid4', value: 400 },
      { label: 'Mid5', value: 500 },
    ];

    const result = groupCategoryTail(data);

    expect(result[0].label).toBe('High');
    expect(result[6].label).toBe('Inne (1 kategorii)');
    expect(result[6].value).toBe(10);
  });
});

describe('getRateColor', () => {
  it.each([
    [29, 'var(--income)'],
    [20, 'var(--income)'],
    [15, 'var(--warning)'],
    [10, 'var(--warning)'],
    [5, 'var(--expense)'],
    [0, 'var(--expense)'],
  ] as const)('returns correct color for rate %d', (rate, expected) => {
    expect(getRateColor(rate)).toBe(expected);
  });
});

describe('formatAmount', () => {
  it('formats number with 2 decimals and zł suffix', () => {
    expect(formatAmount(23.99)).toBe('23,99 zł');
  });

  it('adds trailing zeros', () => {
    expect(formatAmount(49)).toBe('49,00 zł');
  });
});

describe('toMonthlyAmount', () => {
  it('returns amount unchanged for monthly', () => {
    expect(toMonthlyAmount(100, 'monthly')).toBe(100);
  });

  it('divides by 12 for yearly', () => {
    expect(toMonthlyAmount(240, 'yearly')).toBe(20);
  });
});
