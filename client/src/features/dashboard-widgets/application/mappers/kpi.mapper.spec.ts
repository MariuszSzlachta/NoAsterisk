import React from 'react';
import { describe, expect, it } from 'vitest';

import { mapKpiDtoToVm } from '#features/dashboard-widgets/application/mappers/kpi.mapper';
import type { KpiDto } from '#features/dashboard-widgets/infrastructure/api/useKpiQuery';

describe('mapKpiDtoToVm', () => {
  it('maps label, value, delta, trend from DTO', () => {
    const dto: KpiDto = { label: 'Saldo', value: '12 450,00 zł', deltaPercent: '+2,4%', trend: 'up' };

    const vm = mapKpiDtoToVm(dto);

    expect(vm.label).toBe('Saldo');
    expect(vm.value).toBe('12 450,00 zł');
    expect(vm.delta).toBe('+2,4%');
    expect(vm.trend).toBe('up');
  });

  it.each(['Saldo', 'Przychody', 'Wydatki', 'Oszczędności'])(
    'assigns a valid icon for known label "%s"',
    (label) => {
      const dto: KpiDto = { label, value: '1 zł' };

      const vm = mapKpiDtoToVm(dto);

      expect(React.isValidElement(vm.icon)).toBe(true);
    },
  );

  it('assigns fallback icon for unknown labels', () => {
    const dto: KpiDto = { label: 'NieznanyLabel', value: '0 zł' };

    const vm = mapKpiDtoToVm(dto);

    expect(React.isValidElement(vm.icon)).toBe(true);
  });

  it('handles missing optional fields', () => {
    const dto: KpiDto = { label: 'Oszczędności', value: '2 450,00 zł' };

    const vm = mapKpiDtoToVm(dto);

    expect(vm.delta).toBeUndefined();
    expect(vm.trend).toBeUndefined();
  });

  it('passes tooltip through from DTO', () => {
    const dto: KpiDto = { label: 'Saldo', value: '1 zł', tooltip: 'Opis metryki' };

    const vm = mapKpiDtoToVm(dto);

    expect(vm.tooltip).toBe('Opis metryki');
  });

  it('sets tooltip to undefined when not provided', () => {
    const dto: KpiDto = { label: 'Saldo', value: '1 zł' };

    const vm = mapKpiDtoToVm(dto);

    expect(vm.tooltip).toBeUndefined();
  });
});
