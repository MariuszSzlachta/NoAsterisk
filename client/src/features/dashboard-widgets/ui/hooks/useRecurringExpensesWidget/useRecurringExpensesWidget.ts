import { useRecurringExpensesQuery } from '#features/dashboard-widgets/api/useRecurringExpensesQuery';
import { formatAmount, toMonthlyAmount } from '#features/dashboard-widgets/model/transformers';
import type { QueryState } from '#shared/api';

export interface RecurringExpenseVM {
  readonly id: string;
  readonly name: string;
  readonly amount: string;
  readonly cycle: string;
}

export interface RecurringExpensesWidgetVM {
  readonly items: RecurringExpenseVM[];
  readonly total: string;
}

const CYCLE_LABEL: Record<string, string> = {
  monthly: 'mies.',
  yearly: 'rocznie',
};

export const useRecurringExpensesWidget = (): QueryState<RecurringExpensesWidgetVM> => {
  const state = useRecurringExpensesQuery();
  if (state.status !== 'loaded') return state;

  const items = state.data.map((dto) => ({
    id: dto.id,
    name: dto.name,
    amount: formatAmount(dto.amount),
    cycle: CYCLE_LABEL[dto.cycle] ?? dto.cycle,
  }));

  const monthlyTotal = state.data.reduce(
    (sum, dto) => sum + toMonthlyAmount(dto.amount, dto.cycle),
    0,
  );

  return {
    status: 'loaded',
    data: { items, total: formatAmount(monthlyTotal) },
  };
};
