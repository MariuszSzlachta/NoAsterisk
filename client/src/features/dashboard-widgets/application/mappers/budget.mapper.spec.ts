import { describe, expect, it } from 'vitest';

import { mapBudgetDtoToVm } from '#features/dashboard-widgets/application/mappers/budget.mapper';
import type { BudgetDto } from '#features/dashboard-widgets/infrastructure/api/useBudgetQuery';

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
